import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

function findTestFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      findTestFiles(fullPath, fileList);
    } else if (file.endsWith('.test.mjs') || file.endsWith('.test.ts') || file.endsWith('.test.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const testFiles = findTestFiles('tests');
console.log(`\n🧪 Discovered ${testFiles.length} test suite(s):`);
testFiles.forEach(f => console.log(`   • ${f}`));
console.log('\nRunning test suites...\n');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCmd, ['tsx', '--test', ...testFiles], {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 0);
