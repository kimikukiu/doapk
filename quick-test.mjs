import { spawn } from 'child_process';
import http from 'http';

console.log('=== Testing all APIs ===');
const server = spawn('node_modules/.bin/tsx', ['server.ts'], {
  cwd: '/root/doapk',
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['pipe', 'pipe', 'pipe']
});

server.stdout.on('data', (d) => process.stdout.write('[SERVER] ' + d.toString()));
server.stderr.on('data', (d) => process.stderr.write('[ERR] ' + d.toString()));

const wait = (ms) => new Promise(r => setTimeout(r, ms));
await wait(5000);

const tests = [
  ['GET /', 'http://localhost:3000/'],
  ['GET /api/search?q=test', 'http://localhost:3000/api/search?q=test'],
  ['POST /api/local-chat', 'http://localhost:3000/api/local-chat'],
];

for (const [name, url] of tests) {
  try {
    const res = await fetch(url, { method: name.includes('POST') ? 'POST' : 'GET', headers: name.includes('POST') ? {'Content-Type': 'application/json'} : {}, body: name.includes('POST') ? JSON.stringify({message:'test'}) : undefined });
    console.log(`${name}: ${res.status} ✅`);
  } catch (e) {
    console.log(`${name}: FAILED - ${e.message}`);
  }
}

server.kill();
console.log('=== Done ===');
process.exit(0);