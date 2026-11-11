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
const suite = process.argv[2] || 'media-layout';
if (!['media-layout', 'reply-share'].includes(suite)) throw new Error('Unknown browser suite');
const negativeControl = suite === 'reply-share' && process.env.QS_REPLY_NEGATIVE_CONTROL === '1';
const output = resolve(root, `.output/${suite}${negativeControl ? '-negative-control' : ''}-regression`);
await mkdir(output, { recursive: true });
const session = `quickshare-${suite}-${process.pid}`;
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
  optimizeDeps: { include: ['vue', 'lucide-vue-next', 'modern-screenshot'] },
  plugins: [vue(), ...(negativeControl ? [{
    name: 'restore-reported-timestamp-bug', enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/adapters/x.adapter.ts')) return;
      return code.replaceAll('this.getOwnTimestamp(tweet)', 'tweet.querySelector(\'time\')');
    },
  }] : [])],
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
  await cli('open', 'about:blank');
  if (suite === 'reply-share') {
    await cli('route', 'https://abs.twimg.com/**', '--body',
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#777"/></svg>',
      '--content-type', 'image/svg+xml', '--header', 'Access-Control-Allow-Origin: *');
  }
  await cli('goto', `http://127.0.0.1:4183/tests/browser/${suite}.html`);
  const report = await Promise.race([
    completed,
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error(`Browser ${suite} checks timed out after 90 seconds`)), 90000);
    }),
  ]);
  console.log(JSON.stringify(suite === 'reply-share'
    ? { passed: report.cases.length, failures: report.failures }
    : report, null, 2));
  console.log(`Reports and Retina exports: ${output}`);
  if (report.failures.length) process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await cli('close').catch(() => {});
  await server.close();
}
