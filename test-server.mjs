import { spawn } from 'child_process';
import http from 'http';

console.log('=== Starting Server ===');
const server = spawn('node_modules/.bin/tsx', ['server.ts'], {
  cwd: '/root/doapk',
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverReady = false;
let serverOutput = '';

server.stdout.on('data', (d) => {
  const msg = d.toString();
  serverOutput += msg;
  process.stdout.write('[SERVER] ' + msg);
  if (msg.includes('running on')) serverReady = true;
});

server.stderr.on('data', (d) => {
  process.stdout.write('[SERVER ERR] ' + d.toString());
});

const waitForServer = () => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('Server start timeout'));
  }, 10000);
  
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
    res.on('end', () => {
      resolve({ status: res.statusCode, data });
    });
  });
  req.on('error', (e) => resolve({ status: 0, data: e.message }));
  if (options.body) req.write(options.body);
  req.end();
});

try {
  await waitForServer();
  console.log('\n=== Server Ready, Testing APIs ===\n');
  
  // Test 1: Home page
  console.log('Test 1: GET /');
  let r1 = await makeRequest('http://localhost:3000/');
  console.log('  Status:', r1.status, '| Response:', r1.data.substring(0, 100));
  
  // Test 2: Search API
  console.log('\nTest 2: GET /api/search?q=test');
  let r2 = await makeRequest('http://localhost:3000/api/search?q=test');
  console.log('  Status:', r2.status, '| Response:', r2.data.substring(0, 200));
  
  // Test 3: Scrape API
  console.log('\nTest 3: GET /api/scrape?url=https://example.com');
  let r3 = await makeRequest('http://localhost:3000/api/scrape?url=https://example.com');
  console.log('  Status:', r3.status, '| Response:', r3.data.substring(0, 200));
  
  // Test 4: Local Chat API
  console.log('\nTest 4: POST /api/local-chat');
  let r4 = await makeRequest('http://localhost:3000/api/local-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hello' })
  });
  console.log('  Status:', r4.status, '| Response:', r4.data.substring(0, 200));
  
  // Test 5: Manus Chat API
  console.log('\nTest 5: POST /api/manus-chat');
  let r5 = await makeRequest('http://localhost:3000/api/manus-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hello', mode: 'quick' })
  });
  console.log('  Status:', r5.status, '| Response:', r5.data.substring(0, 200));
  
  console.log('\n\n=== All Tests Completed ===');
} catch (err) {
  console.error('Test error:', err.message);
  console.log('Server output:', serverOutput);
} finally {
  server.kill();
  process.exit(0);
}

setTimeout(() => {
  console.error('Overall timeout');
  server.kill();
  process.exit(1);
}, 30000);
