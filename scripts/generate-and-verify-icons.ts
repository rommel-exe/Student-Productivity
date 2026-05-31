import fs from "fs";
import path from "path";
import https from "https";
import zlib from "zlib";
import { Jimp } from "jimp";

/**
 * Downloads a file from a URL.
 */
function download(url: string, dest: string, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      });
    });

    req.on("error", () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });
  });
}

/**
 * PNG CRC-32 checksum implementation.
 */
function calculateCrc(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (c & 1) {
        c = (c >>> 1) ^ 0xedb88320;
      } else {
        c = c >>> 1;
      }
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Validates a PNG file using chunk analysis, zlib inflation, and signature checks.
 */
function validatePNGIntegrity(filePath: string): { ok: boolean; message: string; width?: number; height?: number } {
  if (!fs.existsSync(filePath)) {
    return { ok: false, message: "File does not exist" };
  }

  const stat = fs.statSync(filePath);
  if (stat.size < 8) {
    return { ok: false, message: `File size too small (${stat.size} bytes)` };
  }

  const buf = fs.readFileSync(filePath);
  const expectedSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buf.subarray(0, 8).equals(expectedSig)) {
    return { ok: false, message: "Invalid 8-byte PNG signature header" };
  }

  let offset = 8;
  let hasIhdr = false;
  let hasIdat = false;
  let hasIend = false;
  let width = 0;
  let height = 0;
  const idats: Buffer[] = [];

  while (offset < buf.length) {
    if (offset + 8 > buf.length) {
      return { ok: false, message: `Premature EOF inside chunk header at offset ${offset}` };
    }

    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);

    if (offset + 12 + length > buf.length) {
      return { ok: false, message: `Chunk ${type} of length ${length} overflows file size at offset ${offset}` };
    }

    const chunkData = buf.subarray(offset + 8, offset + 8 + length);
    const crc = buf.readUInt32BE(offset + 8 + length);

    // CRC validation on chunk type + chunk data
    const crcTarget = buf.subarray(offset + 4, offset + 8 + length);
    const calculatedCrc = calculateCrc(crcTarget);
    if (crc !== calculatedCrc) {
      return { ok: false, message: `CRC mismatch in ${type} chunk (read: ${crc}, calc: ${calculatedCrc})` };
    }

    if (type === "IHDR") {
      hasIhdr = true;
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
    } else if (type === "IDAT") {
      hasIdat = true;
      idats.push(chunkData);
    } else if (type === "IEND") {
      hasIend = true;
    }

    offset += 12 + length;
  }

  if (offset !== buf.length) {
    return { ok: false, message: `Extraneous trailing data (${buf.length - offset} bytes) after last chunk` };
  }
  if (!hasIhdr) return { ok: false, message: "Missing required IHDR chunk" };
  if (!hasIdat) return { ok: false, message: "Missing required IDAT chunk" };
  if (!hasIend) return { ok: false, message: "Missing required IEND chunk" };

  // Verify decompression of visual stream
  try {
    const fullIdat = Buffer.concat(idats);
    zlib.inflateSync(fullIdat);
  } catch (zlibErr: any) {
    return { ok: false, message: `Compressed stream decompression failed: ${zlibErr.message}` };
  }

  return { ok: true, message: "Pristine physical and logical chunk hierarchy", width, height };
}

/**
 * Discovers PNG coordinates in directory
 */
function findPngs(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === "node_modules" || file === "dist" || file === ".git" || file === "target") {
      continue;
    }
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findPngs(filePath, fileList);
      } else if (file.toLowerCase().endsWith(".png")) {
        fileList.push(filePath);
      }
    } catch {}
  }
  return fileList;
}

async function run() {
  const masterUrl = "https://unpkg.com/emoji-datasource-apple@14.0.0/img/apple/64/1f4dd.png";
  const masterDest = path.join(process.cwd(), "master_downloaded.png");

  console.log(`[+] Downloading master Apple Note Emoji (64x64) from: ${masterUrl}`);
  const downloaded = await download(masterUrl, masterDest);
  if (!downloaded) {
    console.error("[-] ❌ Error downloading master asset");
    process.exit(1);
  }

  // Verify starting asset
  const masterCheck = validatePNGIntegrity(masterDest);
  if (!masterCheck.ok) {
    console.error(`[-] ❌ Master image does not have standard physical validity: ${masterCheck.message}`);
    process.exit(1);
  }
  console.log(`[+] Downloaded master PNG verified! (${masterCheck.width}x${masterCheck.height}), size=${fs.statSync(masterDest).size} bytes`);

  // Locate targets
  const files = findPngs(process.cwd());
  console.log(`[+] Found ${files.length} candidate destination PNG files in this project.`);

  let successCount = 0;
  let failureCount = 0;

  for (const file of files) {
    const absolute = path.normalize(file);
    const filename = path.basename(absolute);

    // Skip temp and tool scripts
    if (
      absolute === masterDest ||
      filename.includes("leaflet") ||
      filename === "marker.png" ||
      filename.includes("temp_") ||
      filename.includes("test_")
    ) {
      continue;
    }

    try {
      console.log(`\n------------------------------------------------------------`);
      console.log(`[*] Processing: ${path.relative(process.cwd(), absolute)}`);

      // 1. Fetch current target properties
      const targetImg = await Jimp.read(absolute);
      const targetW = targetImg.width;
      const targetH = targetImg.height;
      console.log(`    - Expected dimensions: ${targetW}x${targetH}`);

      // 2. Load master and scale
      const masterImg = await Jimp.read(masterDest);
      masterImg.resize({ w: targetW, h: targetH });

      // 3. Write target with standard Jimp format-aware saving
      await masterImg.write(absolute as `${string}.${string}`);

      // 4. Set explicit general permissions (0644) so any OS/browser/viewer can open it
      fs.chmodSync(absolute, 0o644);
      console.log(`    - Permissions set explicitly to 0644 (readable-writable by owner, readable by global users)`);

      // 5. Instantly test with our rigorous native PNG parser
      const testResult = validatePNGIntegrity(absolute);
      if (testResult.ok && testResult.width === targetW && testResult.height === targetH) {
        console.log(`    - ✅ INTEGRITY TEST PASSED! Physical, logical, and dimension parameters are 100% correct.`);
        successCount++;
      } else {
        console.error(`    - ❌ INTEGRITY TEST FAILED: ${testResult.message} (${testResult.width}x${testResult.height})`);
        failureCount++;
      }
    } catch (err: any) {
      console.error(`    - ❌ Scaling / writing failed: ${err.message}`);
      failureCount++;
    }
  }

  console.log(`\n============================================================`);
  console.log(`STATUS REPORT:`);
  console.log(`- Successfully updated, set permissions, and validated: ${successCount} files`);
  console.log(`- Failed operations: ${failureCount} files`);
  console.log(`============================================================`);

  // Clean remaining files if exists
  if (fs.existsSync(masterDest)) {
    fs.unlinkSync(masterDest);
  }

  process.exit(failureCount === 0 ? 0 : 1);
}

run();
