import fs from "fs";
import path from "path";

function findPngs(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" || dir === process.cwd()) {
        try {
          findPngs(filePath, fileList);
        } catch {}
      }
    } else if (file.endsWith(".png")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Search specifically inside node_modules
const nmDir = path.join(process.cwd(), "node_modules");
const list: string[] = [];
if (fs.existsSync(nmDir)) {
  const rootFiles = fs.readdirSync(nmDir);
  for (const rf of rootFiles) {
    const rfPath = path.join(nmDir, rf);
    try {
      const stat = fs.statSync(rfPath);
      if (stat.isDirectory()) {
        findPngs(rfPath, list);
        if (list.length > 50) break; // Limit
      }
    } catch {}
  }
}

console.log(`Found ${list.length} PNGs in node_modules:`);
for (const item of list.slice(0, 30)) {
  const buf = fs.readFileSync(item);
  const header = buf.subarray(0, 8);
  const isValid = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  console.log(`- ${path.relative(process.cwd(), item)}: Size = ${buf.length} bytes, Valid PNG: ${isValid}`);
}
