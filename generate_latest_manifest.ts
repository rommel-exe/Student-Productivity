import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MAX_RETRIES = 5;

function downloadAsset(version: string, assetName: string): void {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      console.log(`Attempt ${attempt + 1}: Downloading ${assetName} via gh CLI...`);
      execSync(`gh release download ${version} -p "${assetName}" --clobber`, { stdio: 'inherit' });
      return;
    } catch (err: any) {
      console.warn(`Download failed, retrying in 10s...`);
      execSync(`sleep 10`);
      attempt++;
    }
  }
  throw new Error(`Failed to download ${assetName} after ${MAX_RETRIES} attempts.`);
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
      downloadAsset(versionArg, asset.name);
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

