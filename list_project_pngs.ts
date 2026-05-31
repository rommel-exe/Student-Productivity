import fs from "fs";
import path from "path";

function findPngs(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === "node_modules" || file === "dist" || file === ".git" || file === "target") {
      continue;
    }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findPngs(filePath, fileList);
    } else if (file.toLowerCase().endsWith(".png")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const list = findPngs(process.cwd());
console.log(`Found ${list.length} PNGs in the project (excluding node_modules/dist):`);
for (const item of list) {
  const relative = path.relative(process.cwd(), item);
  console.log(`- ${relative}`);
}
