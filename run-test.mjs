import { spawn } from 'child_process';
import http from 'http';

console.log('=== Starting Server ===');
const server = spawn('node_modules/.bin/tsx', ['server.ts'], {
  cwd: '/root/doapk',
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverReady = false;
let output = '';

server.stdout.on('data', (d) => {
  const msg = d.toString();
  output += msg;
  if (msg.includes('running on')) {
    serverReady = true;
    console.log('[SERVER]', msg.trim());
  }
});

server.stderr.on('data', (d) => {
  console.log('[SERVER ERR]', d.toString().trim());
});

// Wait for server
const waitForServer = () => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('timeout')), 20000);
  const check = setInterval(() => {
    if (serverReady) {
      clearTimeout(timeout);
      clearInterval(check);
      resolve(true);
    }
  }, 500);
});

const makeRequest = (url, options = {}) => new Promise((resolve) => {
  const req = http.request(url, options, (res) => {
    let data = '';
    res.on('data', (d) => data += d);
    res.on('end', () => resolve({ status: res.statusCode, data }));
  });
  req.on('error', (e) => resolve({ status: 0, data: e.message }));
  if (options.body) req.write(options.body);
  req.end();
});

try {
  await waitForServer();
  console.log('\n=== Server Ready, Testing APIs ===\n');
  
  const tests = [
    ['Home page', () => makeRequest('http://localhost:3000/')],
    ['Search API', () => makeRequest('http://localhost:3000/api/search?q=test')],
    ['Scrape API', () => makeRequest('http://localhost:3000/api/scrape?url=https://example.com')],
    ['Local Chat API', () => makeRequest('http://localhost:3000/api/local-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello' })
    })],
    ['Manus Chat API', () => makeRequest('http://localhost:3000/api/manus-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hello', mode: 'quick' })
    })]
  ];

  for (const [name, testFn] of tests) {
    console.log(`Test: ${name}`);
    const result = await testFn();
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${result.data.substring(0, 150)}\n`);
  }

  console.log('=== All Tests Completed ===');
} catch (err) {
  console.error('Test error:', err.message);
  console.log('Server output:', output);
} finally {
  server.kill();
  process.exit(0);
}

setTimeout(() => {
  console.error('Overall timeout');
  server.kill();
  process.exit(1);
}, 45000);
