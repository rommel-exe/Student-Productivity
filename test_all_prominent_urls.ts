import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { URL } from "url";

async function download(urlStr: string, dest: string, redirectCount = 0): Promise<boolean> {
  if (redirectCount > 5) {
    return false;
  }
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(urlStr);
      const client = urlObj.protocol === "https:" ? https : http;

      client.get(urlStr, (res) => {
        const statusCode = res.statusCode || 0;

        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith("http:") && !redirectUrl.startsWith("https:")) {
            redirectUrl = new URL(redirectUrl, urlStr).href;
          }
          resolve(download(redirectUrl, dest, redirectCount + 1));
          return;
        }

        if (statusCode !== 200) {
          resolve(false);
          return;
        }

        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(true);
        });
      }).on("error", () => {
        resolve(false);
      });
    } catch {
      resolve(false);
    }
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
    { name: "Tauri Template Main github", url: "https://github.com/tauri-apps/tauri/raw/main/packages/cli/templates/plugin/src-tauri/icons/128x128.png" },
    { name: "Tauri Template Next github", url: "https://github.com/tauri-apps/tauri/raw/next/packages/cli/templates/plugin/src-tauri/icons/128x128.png" },
    { name: "Joplin Assets master logo github", url: "https://github.com/joplin/assets/raw/master/joplin_logo_512.png" },
    { name: "Joplin Logo dev github", url: "https://github.com/laurent22/joplin/raw/dev/Assets/joplin_logo_512.png" },
    { name: "Leaflet Marker 2x unpkg", url: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png" }
  ];

  for (const c of candidates) {
    const filename = `temp_${c.name.toLowerCase().replace(/ /g, "_")}.png`;
    console.log(`Checking ${c.name}...`);
    const success = await download(c.url, filename);
    if (success) {
      const isValid = checkPng(filename);
      const size = fs.statSync(filename).size;
      console.log(`- ${c.name}: Status = SUCCESS, Size = ${size} bytes, Valid PNG = ${isValid}`);
      if (isValid) {
        console.log(`🎉 Perfect valid PNG downloaded! Leaving at: ${filename}`);
      } else {
        if (fs.existsSync(filename)) fs.unlinkSync(filename);
      }
    } else {
      console.log(`- ${c.name}: Status = FAILED`);
    }
  }
}

run();
