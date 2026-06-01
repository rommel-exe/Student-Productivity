import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

// Follow redirects helper
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = (currentUrl: string) => {
      https.get(currentUrl, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            request(redirectUrl);
          } else {
            reject(new Error(`Redirect response without location header from ${currentUrl}`));
          }
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Server returned status code ${res.statusCode} for ${currentUrl}`));
          return;
        }

        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(dest, () => reject(err));
        });
      }).on('error', reject);
    };

    request(url);
  });
}

function extractSignature(filePath: string): string {
  try {
    const password = process.env.TAURI_KEY_PASSWORD || '';
    const rawOutput = execSync(`npx tauri signer sign -f tauri-keys "${filePath}" -p "${password}"`, { encoding: 'utf8' });
    const match = rawOutput.match(/Public signature:\s*([\s\S]+?)(?=\n\n|\n*$)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    throw new Error(`Could not parse signature from CLI output: ${rawOutput}`);
  } catch (error: any) {
    console.error(`Error signing ${filePath}:`, error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const versionArg = args[0] || 'v0.0.1';
  const cleanVersion = versionArg.replace(/^v/, '');

  console.log(`Starting signature generation for tag: ${versionArg} (version: ${cleanVersion})...`);

  const assetsToSign = [
    {
      id: 'darwin-aarch64',
      name: `OneNoteObsidian_aarch64.app.tar.gz`,
      url: `https://github.com/rommel-exe/Student-Productivity/releases/download/${versionArg}/OneNoteObsidian_aarch64.app.tar.gz`
    },
    {
      id: 'linux-x86_64',
      name: `OneNoteObsidian_${cleanVersion}_amd64.AppImage`,
      url: `https://github.com/rommel-exe/Student-Productivity/releases/download/${versionArg}/OneNoteObsidian_${cleanVersion}_amd64.AppImage`
    },
    {
      id: 'windows-x86_64',
      name: `OneNoteObsidian_${cleanVersion}_x64_en-US.msi`,
      url: `https://github.com/rommel-exe/Student-Productivity/releases/download/${versionArg}/OneNoteObsidian_${cleanVersion}_x64_en-US.msi`
    }
  ];

  const platforms: Record<string, { signature: string; url: string }> = {};

  for (const asset of assetsToSign) {
    const destPath = path.join(process.cwd(), asset.name);
    console.log(`\n--------------------------------------------`);
    console.log(`Downloading: ${asset.name}`);
    console.log(`From URL: ${asset.url}`);
    
    try {
      await downloadFile(asset.url, destPath);
      const sizeBytes = fs.statSync(destPath).size;
      console.log(`Successfully downloaded ${asset.name} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);

      console.log(`Generating signature using Tauri CLI...`);
      const signature = extractSignature(destPath);
      console.log(`SUCCESS! Signature generated.`);

      platforms[asset.id] = {
        signature,
        url: asset.url
      };

      fs.unlinkSync(destPath);
      console.log(`Cleaned up temporary download file.`);
    } catch (err: any) {
      console.error(`FAILED to process ${asset.name}:`, err.message);
    }
  }

  const latestJson = {
    version: cleanVersion,
    notes: `Official release ${versionArg} update schema files.`,
    pub_date: new Date().toISOString(),
    platforms
  };

  const outputPath = path.join(process.cwd(), 'latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(latestJson, null, 2));
  console.log(`\n============================================`);
  console.log(`🎉 SUCCEEDED! Wrote complete updated manifest to: ${outputPath}`);
  console.log(JSON.stringify(latestJson, null, 2));
}

main().catch(console.error);
