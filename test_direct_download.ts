import fs from "fs";
import path from "path";
import https from "https";

function download(url: string, dest: string, timeoutMs = 4000): Promise<boolean> {
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

    req.on("error", (err) => {
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
  const url = "https://unpkg.com/react-scripts@5.0.1/template/public/logo512.png";
  const success = await download(url, "react_logo512.png");
  if (success) {
    const isValid = checkPng("react_logo512.png");
    console.log(`React scripts template logo512.png size: ${fs.statSync("react_logo512.png").size} bytes, Valid PNG: ${isValid}`);
    fs.unlinkSync("react_logo512.png");
  } else {
    console.log("Failed to download react logo512.png");
  }
}

run();
