const { spawn } = require('child_process');
const http = require('http');

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
  const msg = d.toString();
  process.stderr.write('[SERVER ERR] ' + msg);
});

// Wait for server to start
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

waitForServer()
  .then(() => {
    console.log('\n=== Server Ready, Testing APIs ===\n');
    
    // Test 1: Home page
    return new Promise((resolve) => {
      console.log('Test 1: GET /');
      http.get('http://localhost:3000/', (res) => {
        console.log('  Status:', res.statusCode);
        resolve();
      }).on('error', (e) => {
        console.log('  FAILED:', e.message);
        resolve();
      });
    });
  })
  .then(() => {
    // Test 2: Search API
    return new Promise((resolve) => {
      console.log('\nTest 2: GET /api/search?q=test');
      http.get('http://localhost:3000/api/search?q=test', (res) => {
        let data = '';
        res.on('data', (d) => data += d);
        res.on('end', () => {
          console.log('  Status:', res.statusCode);
          try {
            const json = JSON.parse(data);
            console.log('  Response:', JSON.stringify(json).substring(0, 200));
          } catch {
            console.log('  Response:', data.substring(0, 200));
          }
          resolve();
        });
      }).on('error', (e) => {
        console.log('  FAILED:', e.message);
        resolve();
      });
    });
  })
  .then(() => {
    // Test 3: Scrape API
    return new Promise((resolve) => {
      console.log('\nTest 3: GET /api/scrape?url=https://example.com');
      http.get('http://localhost:3000/api/scrape?url=https://example.com', (res) => {
        let data = '';
        res.on('data', (d) => data += d);
        res.on('end', () => {
          console.log('  Status:', res.statusCode);
          console.log('  Response:', data.substring(0, 200));
          resolve();
        });
      }).on('error', (e) => {
        console.log('  FAILED:', e.message);
        resolve();
      });
    });
  })
  .then(() => {
    // Test 4: Local Chat API
    return new Promise((resolve) => {
      console.log('\nTest 4: POST /api/local-chat');
      const req = http.request('http://localhost:3000/api/local-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', (d) => data += d);
        res.on('end', () => {
          console.log('  Status:', res.statusCode);
          try {
            const json = JSON.parse(data);
            console.log('  Response:', JSON.stringify(json).substring(0, 200));
          } catch {
            console.log('  Response:', data.substring(0, 200));
          }
          resolve();
        });
      });
      req.on('error', (e) => {
        console.log('  FAILED:', e.message);
        resolve();
      });
      req.end(JSON.stringify({ message: 'hello' }));
    });
  })
  .then(() => {
    // Test 5: Manus Chat API
    return new Promise((resolve) => {
      console.log('\nTest 5: POST /api/manus-chat');
      const req = http.request('http://localhost:3000/api/manus-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', (d) => data += d);
        res.on('end', () => {
          console.log('  Status:', res.statusCode);
          try {
            const json = JSON.parse(data);
            console.log('  Response:', JSON.stringify(json).substring(0, 200));
          } catch {
            console.log('  Response:', data.substring(0, 200));
          }
          resolve();
        });
      });
      req.on('error', (e) => {
        console.log('  FAILED:', e.message);
        resolve();
      });
      req.end(JSON.stringify({ message: 'hello', mode: 'quick' }));
    });
  })
  .then(() => {
    console.log('\n=== All Tests Completed ===');
    server.kill();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test error:', err);
    server.kill();
    process.exit(1);
  });

setTimeout(() => {
  console.error('Overall timeout');
  server.kill();
  process.exit(1);
}, 30000);
