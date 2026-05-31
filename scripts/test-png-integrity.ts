import fs from "fs";
import path from "path";
import zlib from "zlib";
import { Jimp } from "jimp";

/**
 * Standard CRC32 table calculator for verifying PNG chunk checksums.
 */
function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    table[n] = c;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function calculateCrc(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

interface ImageValidationResult {
  filePath: string;
  isValid: boolean;
  fileSize: number;
  width?: number;
  height?: number;
  error?: string;
  recommendation?: string;
}

/**
 * Validates a PNG file's binary integrity.
 * Specifically checks for Git line-ending conversions (LF -> CRLF) or other file-transfer corruptions.
 */
function validatePngIntegrity(absolutePath: string): ImageValidationResult {
  const relativePath = path.relative(process.cwd(), absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      filePath: relativePath,
      isValid: false,
      fileSize: 0,
      error: "File does not exist on disk",
    };
  }

  const buf = fs.readFileSync(absolutePath);
  const size = buf.length;

  if (size < 8) {
    return {
      filePath: relativePath,
      isValid: false,
      fileSize: size,
      error: `File is too small to contain a PNG signature (${size} bytes)`,
    };
  }

  // Standard PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  const sig = buf.subarray(0, 8);
  const expectedSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Check for common Git/HTTP text translation corruption (LF becoming CRLF)
  // Standard conversion replaces 0A (\n) with 0D 0A (\r\n)
  if (!sig.equals(expectedSig)) {
    // Check if we find 0D 0D 0A (double CR) or similar CRLF corruptions in the signature header
    const hasCrlfCorruption = 
      buf.includes(Buffer.from([137, 80, 78, 71, 13, 13, 10])) ||
      (buf[4] === 13 && buf[5] === 13 && buf[6] === 10) || // 0D 0D 0A
      (buf[4] === 13 && buf[5] === 10 && buf[7] === 13 && buf[8] === 10); // 0D 0A ... 0D 0A

    if (hasCrlfCorruption) {
      return {
        filePath: relativePath,
        isValid: false,
        fileSize: size,
        error: "CRLF / Line-Ending Corruption Detected",
        recommendation: "Your Git client or download tool mistakenly converted the PNG from binary format to text (LF -> CRLF translation).\n" +
                        "👉 FIX 1: Run 'git config core.autocrlf false', then clean and re-checkout with: 'git checkout-index --force --all'\n" +
                        "👉 FIX 2: Ensure you are using the .gitattributes file provided at the repository root.",
      };
    }

    return {
      filePath: relativePath,
      isValid: false,
      fileSize: size,
      error: `Invalid PNG Signature. Expected [137, 80, 78, 71, 13, 10, 26, 10], got [${Array.from(sig).join(", ")}]`,
      recommendation: "The file may be completely empty, corrupted during transfer, or saved in an incorrect format.",
    };
  }

  let offset = 8;
  let hasIhdr = false;
  let hasIdat = false;
  let hasIend = false;
  let width = 0;
  let height = 0;
  const idatBuffers: Buffer[] = [];

  try {
    while (offset < buf.length) {
      if (offset + 8 > buf.length) {
        return {
          filePath: relativePath,
          isValid: false,
          fileSize: size,
          error: `Premature EOF inside chunk header at byte offset ${offset}`,
        };
      }

      const length = buf.readUInt32BE(offset);
      const type = buf.toString("ascii", offset + 4, offset + 8);

      if (offset + 12 + length > buf.length) {
        return {
          filePath: relativePath,
          isValid: false,
          fileSize: size,
          error: `Chunk header mismatch: ${type} chunk of size ${length} extends beyond file size`,
        };
      }

      // Extract chunk data and CRC bytes
      const chunkData = buf.subarray(offset + 8, offset + 8 + length);
      const crc = buf.readUInt32BE(offset + 8 + length);

      // Verify CRC Checksum
      const crcInputBytes = buf.subarray(offset + 4, offset + 8 + length);
      const calculatedCrc = calculateCrc(crcInputBytes);

      if (crc !== calculatedCrc) {
        return {
          filePath: relativePath,
          isValid: false,
          fileSize: size,
          error: `CRC mismatch in chunk '${type}' (expected ${calculatedCrc.toString(16)}, got ${crc.toString(16)})`,
          recommendation: "The binary file data is corrupted. This typically suggests byte-level alteration during download/upload or disk failure.",
        };
      }

      if (type === "IHDR") {
        hasIhdr = true;
        width = buf.readUInt32BE(offset + 8);
        height = buf.readUInt32BE(offset + 12);
      } else if (type === "IDAT") {
        hasIdat = true;
        idatBuffers.push(chunkData);
      } else if (type === "IEND") {
        hasIend = true;
      }

      offset += 12 + length;
    }
  } catch (err: any) {
    return {
      filePath: relativePath,
      isValid: false,
      fileSize: size,
      error: `Exception raised during binary parsing: ${err.message}`,
    };
  }

  if (offset !== buf.length) {
    return {
      filePath: relativePath,
      isValid: false,
      fileSize: size,
      error: `Extraneous trailing data (${buf.length - offset} bytes) discovered at the end of the PNG stream`,
    };
  }

  if (!hasIhdr) return { filePath: relativePath, isValid: false, fileSize: size, error: "Missing mandatory IHDR header chunk" };
  if (!hasIdat) return { filePath: relativePath, isValid: false, fileSize: size, error: "Missing mandatory IDAT image data chunk" };
  if (!hasIend) return { filePath: relativePath, isValid: false, fileSize: size, error: "Missing mandatory IEND footer chunk" };

  // Validate inflate compression stream integrity
  try {
    const combinedIdat = Buffer.concat(idatBuffers);
    zlib.inflateSync(combinedIdat);
  } catch (zlibErr: any) {
    return {
      filePath: relativePath,
      isValid: false,
      fileSize: size,
      error: `Decompression of IDAT image steam failed: ${zlibErr.message}`,
      recommendation: "The visual zip stream is corrupted (likely due to text-encoding translation replacing \\n inside raw data).",
    };
  }

  return {
    filePath: relativePath,
    isValid: true,
    fileSize: size,
    width,
    height,
  };
}

/**
 * Searches the directory for PNG files.
 */
function findPngFiles(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === "node_modules" || file === "dist" || file === ".git" || file === "target") {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findPngFiles(fullPath, results);
    } else if (file.toLowerCase().endsWith(".png")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function testPngs() {
  console.log("============================================================");
  console.log("🔍 PNG PORTABILITY & INTEGRITY DIAGNOSTIC TEST");
  console.log("============================================================\n");

  const pngFiles = findPngFiles(process.cwd());
  console.log(`[+] Discovered ${pngFiles.length} PNG assets in clean path.`);

  let failures = 0;
  let successCount = 0;

  for (const file of pngFiles) {
    const filename = path.basename(file);
    // Ignore dynamic temp/test assets
    if (
      filename.includes("temp_") || 
      filename.includes("test_") || 
      filename === "marker.png" ||
      filename.includes("leaflet")
    ) {
      continue;
    }

    const check = validatePngIntegrity(file);
    if (check.isValid) {
      console.log(`✅ [OK]   ${check.filePath} (${check.width}x${check.height}) - Pristine Standard Format.`);
      successCount++;
      
      // Secondary check: verify Jimp can decode it successfully
      try {
        const decoded = await Jimp.read(file);
        if (decoded.width !== check.width || decoded.height !== check.height) {
          console.error(`  ⚠️ [WARN] Chunk parser and Jimp got mismatched dimensions on ${check.filePath}`);
        }
      } catch (jimpErr: any) {
        console.error(`  ❌ [FAIL] ${check.filePath} parsed physically but failed decoding under Jimp: ${jimpErr.message}`);
        failures++;
      }
    } else {
      console.error(`❌ [FAIL] ${check.filePath}`);
      console.error(`  - Reason: ${check.error}`);
      if (check.recommendation) {
        console.error(`  - Recommendation:\n${check.recommendation.split("\n").map(l => "    " + l).join("\n")}`);
      }
      failures++;
    }
  }

  console.log("\n============================================================");
  console.log("DIAGNOSTIC STATUS:");
  console.log(`- Successfully Passed: ${successCount} files`);
  console.log(`- Failed/Corrupt:     ${failures} files`);
  console.log("============================================================");

  if (failures > 0) {
    console.error("\n❌ TEST SUITE FAILED: Corrupted or unopenable PNG files found.");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL PNG FILES ARE 100% HEALTHY, PORTABLE, AND OPEN-READY!");
    process.exit(0);
  }
}

testPngs();
