import fs from "fs";
import path from "path";
import https from "https";

async function download(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.warn(`Failed to download ${url}: status code = ${response.statusCode}`);
        file.close();
        fs.unlinkSync(dest);
        resolve(false);
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          resolve(true);
        });
      });
    }).on("error", (err) => {
      console.warn(`Error downloading ${url}:`, err.message);
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      resolve(false);
    });
  });
}

function checkPng(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 8) return false;
  const header = buffer.subarray(0, 8);
  return header[0] === 0x89 &&
         header[1] === 0x50 &&
         header[2] === 0x4e &&
         header[3] === 0x47 &&
         header[4] === 0x0d &&
         header[5] === 0x0a &&
         header[6] === 0x1a &&
         header[7] === 0x0a;
}

async function run() {
  const candidates = [
    { name: "Joplin Logo", url: "https://raw.githubusercontent.com/laurent22/joplin/dev/Assets/joplin_logo_512.png" },
    { name: "Vite Logo", url: "https://raw.githubusercontent.com/vitejs/vite/main/docs/public/logo.png" },
    { name: "Tauri Logo", url: "https://raw.githubusercontent.com/tauri-apps/tauri/main/packages/cli/templates/plugin/src-tauri/icons/128x128.png" }
  ];

  console.log("Checking candidate URLs for valid PNG download:");
  for (const c of candidates) {
    const tempDest = path.join(process.cwd(), `temp_${c.name.toLowerCase().replace(/ /g, "_")}.png`);
    console.log(`Downloading ${c.name}...`);
    const success = await download(c.url, tempDest);
    if (success) {
      const isValid = checkPng(tempDest);
      const size = fs.existsSync(tempDest) ? fs.statSync(tempDest).size : 0;
      console.log(`- ${c.name}: Success = ${success}, Size = ${size} bytes, Valid PNG Header = ${isValid}`);
      if (isValid) {
        console.log(`🎉 Found super high-quality VALID PNG: ${c.name}`);
        // Let's use this!
        fs.renameSync(tempDest, path.join(process.cwd(), "master_downloaded.png"));
        // Clean remaining temp files if any
        candidates.forEach(other => {
          const pathOther = path.join(process.cwd(), `temp_${other.name.toLowerCase().replace(/ /g, "_")}.png`);
          if (fs.existsSync(pathOther)) fs.unlinkSync(pathOther);
        });
        process.exit(0);
      } else {
        if (fs.existsSync(tempDest)) fs.unlinkSync(tempDest);
      }
    }
  }
  console.error("❌ Failed to find any valid PNG downloaded from candidate list!");
  process.exit(1);
}

run();
