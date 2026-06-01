import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function main() {
  const args = process.argv.slice(2);
  const versionArg = args[0] || 'v0.0.1';
  const cleanVersion = versionArg.replace(/^v/, '');

  console.log(`Generating manifest from GitHub Release assets for tag: ${versionArg}...`);

  // Use GitHub CLI to get all assets for this release
  const releaseJson = execSync(`gh release view ${versionArg} --json assets`, { encoding: 'utf8' });
  const releaseInfo = JSON.parse(releaseJson);
  const assets: { name: string, url: string }[] = releaseInfo.assets;

  console.log(`Found ${assets.length} assets in release ${versionArg}.`);

  const platforms: Record<string, { signature: string; url: string }> = {};

  // Find all .sig files
  const sigAssets = assets.filter(a => a.name.endsWith('.sig'));

  for (const sig of sigAssets) {
    const parentName = sig.name.replace(/\.sig$/, '');
    const parentAsset = assets.find(a => a.name === parentName);
    
    if (!parentAsset) {
      console.warn(`Could not find parent asset for ${sig.name}`);
      continue;
    }

    console.log(`Fetching signature from ${sig.url}...`);
    // Download the .sig file content
    const sigContent = execSync(`curl -sL "${sig.url}"`, { encoding: 'utf8' }).trim();

    // Map filename to Tauri platform keys
    let platformKey = '';
    if (parentName.includes('aarch64.app')) {
      platformKey = 'darwin-aarch64';
    } else if (parentName.includes('x64.app')) {
      platformKey = 'darwin-x86_64';
    } else if (parentName.includes('AppImage.tar.gz')) {
      platformKey = 'linux-x86_64';
    } else if (parentName.includes('windows') || parentName.includes('nsis.zip') || parentName.includes('msi.zip') || parentName.includes('x64-setup')) {
      platformKey = 'windows-x86_64';
    } else {
      console.warn(`Unrecognized platform for asset: ${parentAsset.name}`);
      // Fallback guessing
      if (parentAsset.name.endsWith('.tar.gz')) platformKey = 'linux-x86_64';
      if (parentAsset.name.endsWith('.zip')) platformKey = 'windows-x86_64';
    }

    if (platformKey) {
      platforms[platformKey] = {
        signature: sigContent,
        url: parentAsset.url
      };
      console.log(`Mapped ${parentAsset.name} to ${platformKey}.`);
    }
  }

  const latestJson = {
    version: cleanVersion,
    notes: `Update ${versionArg} is now available. Bug fixes and performance improvements.`,
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
