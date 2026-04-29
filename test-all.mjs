import { spawn } from 'child_process';

const srv = spawn('node_modules/.bin/tsx', ['server.ts'], {
  cwd: '/root/doapk',
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let ready = false;
srv.stdout.on('data', d => {
  const s = d.toString();
  console.log('[OUT]', s);
  if (s.includes('running on')) ready = true;
});
srv.stderr.on('data', d => console.log('[ERR]', d.toString()));

// Wait for server
await new Promise(r => setTimeout(r, 6000));

if (!ready) {
  console.log('Server NOT ready!');
  srv.kill();
  process.exit(1);
}

console.log('Server ready! Testing APIs...');

// Test 1: Home
const r1 = await fetch('http://localhost:3000/');
console.log('GET / :', r1.status);

// Test 2: Search
const r2 = await fetch('http://localhost:3000/api/search?q=test');
console.log('GET /api/search:', r2.status, await r2.text().then(t => t.substring(0, 50)));

// Test 3: Local Chat
const r3 = await fetch('http://localhost:3000/api/local-chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'hello'})
});
console.log('POST /api/local-chat:', r3.status, await r3.text().then(t => t.substring(0, 80)));

console.log('All tests done!');
srv.kill();
process.exit(0);