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

async function run() {
  const emojis = [
    { name: "Notebook 1f4dd", code: "1f4dd" },
    { name: "Graduation Cap 1f393", code: "1f393" },
    { name: "Calendar 1f4c5", code: "1f4c5" },
    { name: "Open Book 1f4d6", code: "1f4d6" },
    { name: "Spiral Notepad 1f5d2", code: "1f5d2" }
  ];

  for (const item of emojis) {
    const url = `https://unpkg.com/emoji-datasource-apple@14.0.0/img/apple/64/${item.code}.png`;
    const dest = `emoji_${item.code}.png`;
    const ok = await download(url, dest);
    console.log(`Emoji ${item.name}: Status = ${ok ? "SUCCESS" : "FAILED"}, Size = ${ok ? fs.statSync(dest).size : 0} bytes`);
    if (ok && fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
  }
}

run();
