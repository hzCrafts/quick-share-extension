import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Use the same Playwright CLI as local visual verification; no product runtime
// dependency or access to the user's logged-in Chrome profile is required.
const require = createRequire(import.meta.url);
const { createServer } = await import(
  require.resolve('vite', { paths: [require.resolve('@vitejs/plugin-vue')] })
);
const { default: vue } = await import('@vitejs/plugin-vue');
const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, '.output/media-layout-regression');
await mkdir(output, { recursive: true });
const session = `quickshare-media-${process.pid}`;
const cli = (...args) =>
  run('npx', ['--yes', '--package', '@playwright/cli@0.1.22', 'playwright-cli', '--session', session, ...args], {
    cwd: output,
    timeout: 60000,
  });
let finish;
const completed = new Promise((resolve) => {
  finish = resolve;
});
const server = await createServer({
  configFile: false,
  root,
  plugins: [vue()],
  resolve: { alias: { '@': resolve(root, 'src') } },
  server: { host: '127.0.0.1', port: 4183, strictPort: true },
});
server.middlewares.use('/__media_results', async (req, res) => {
  const name = req.url?.slice(1);
  if (req.method !== 'POST' || !/^[a-z0-9-]+\.(png|json)$/.test(name || '')) {
    res.statusCode = 400;
    res.end();
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const data = Buffer.concat(chunks);
  await writeFile(resolve(output, name), data);
  res.end('ok');
  if (name === 'report.json') finish(JSON.parse(data.toString('utf8')));
});
server.middlewares.stack.unshift(server.middlewares.stack.pop());
let timeout;
try {
  await server.listen();
  await cli('open', 'http://127.0.0.1:4183/tests/browser/media-layout.html');
  const report = await Promise.race([
    completed,
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Browser media checks timed out after 90 seconds')), 90000);
    }),
  ]);
  console.log(JSON.stringify(report, null, 2));
  console.log(`Reports and Retina exports: ${output}`);
  if (report.failures.length) process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await cli('close').catch(() => {});
  await server.close();
}
