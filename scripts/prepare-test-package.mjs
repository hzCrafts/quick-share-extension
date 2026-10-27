import { cpSync, existsSync, lstatSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '.output/chrome-mv3');
const target = resolve(root, '../QuickShare-test-latest');
// Read and validate the build before replacing the existing test package.
const manifest = JSON.parse(readFileSync(resolve(source, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3 || !manifest.action) {
  throw new Error('Expected a Chrome MV3 build. Run pnpm build first.');
}
if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
  throw new Error('The test package directory must not be a symbolic link.');
}

manifest.name = 'QuickShare（测试版） - 社交媒体卡片分享';
manifest.short_name = 'QuickShare（测试版）';
manifest.action.default_title = 'QuickShare（测试版）';

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
writeFileSync(resolve(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Updated ${target}: ${manifest.name} v${manifest.version}`);
