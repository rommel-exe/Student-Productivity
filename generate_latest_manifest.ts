import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

const MAX_RETRIES = 6;
const RETRY_DELAY = 10000; // 10 seconds

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const request = (currentUrl: string) => {
      console.log(`[Attempt ${attempt + 1}/${MAX_RETRIES}] GET ${currentUrl}`);
      https.get(currentUrl, { headers: { 'User-Agent': 'NodeUpdater/1.0' } }, (res) => {
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
          if (attempt < MAX_RETRIES - 1) {
            attempt++;
            console.log(`Server returned status ${res.statusCode}. Retrying in ${RETRY_DELAY/1000}s...`);
            setTimeout(() => request(url), RETRY_DELAY); // Retry the ORIGINAL url, not the redirect (in case the redirect was what 404'd)
          } else {
            reject(new Error(`Server returned status code ${res.statusCode} for ${currentUrl}`));
          }
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
      }).on('error', (err) => {
        if (attempt < MAX_RETRIES - 1) {
          attempt++;
          console.log(`Network error: ${err.message}. Retrying in ${RETRY_DELAY/1000}s...`);
          setTimeout(() => request(url), RETRY_DELAY);
        } else {
          reject(err);
        }
      });
    };

    request(url);
  });
}

function extractSignature(filePath: string): string {
  try {
    const rawOutput = execSync(`npx tauri signer sign "${filePath}"`, { encoding: 'utf8' });
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

  // Force URLs to use exact asset names
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
      name: `OneNoteObsidian_${cleanVersion}_x64-setup.exe`,
      url: `https://github.com/rommel-exe/Student-Productivity/releases/download/${versionArg}/OneNoteObsidian_${cleanVersion}_x64-setup.exe`
    }
  ];

  const platforms: Record<string, { signature: string; url: string }> = {};

  for (const asset of assetsToSign) {
    const destPath = path.join(process.cwd(), asset.name);
    console.log(`\n--------------------------------------------`);
    console.log(`Downloading: ${asset.name}`);
    
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
      process.exit(1);
    }
  }

  const latestJson = {
    version: cleanVersion,
    notes: `Official release ${versionArg} is now available. Important bug fixes for the updater manifest format.`,
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

