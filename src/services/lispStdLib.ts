// ==================== WHOAMISEC LISP EXTENDED STANDARD LIBRARY ====================
// Implements ALL awesome-cl ecosystem modules as built-in LISP functions
// Covers: Auth, Web, Email, API, Numerical, Matrix, Stats, Concurrency,
// Regex, Scripting, Shell, Testing, Caching, Compression, Config, DateTime,
// Validation, Files, Git, Logging, Markdown, PDF, Security, System, and more.

import { lispDefineJs } from './lispService';
import { lispApiEval } from './lispApi';
import { registerCryptoModule } from './lispCrypto';
import { registerDatabaseModule } from './lispDatabase';
import { registerAiMlModule } from './lispAiMl';
import { registerLispBreakerModules } from './lispBreaker';

// ==================== USER LOGIN & PASSWORD MANAGEMENT ====================
function registerAuthModule() {
  const users: Map<string, { hash: string; salt: string; roles: string[]; created: number; locked: boolean; attempts: number }> = new Map();
  const sessions: Map<string, { user: string; expires: number; ip: string }> = new Map();
  const tokens: Map<string, { user: string; type: string; expires: number }> = new Map();

  function hashPassword(password: string, salt: string): string {
    let hash = 0;
    const combined = salt + password + salt;
    for (let i = 0; i < combined.length; i++) {
      const chr = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash = (hash * 0x5bd1e995) ^ (hash >>> 15);
      hash |= 0;
    }
    return Math.abs(hash).toString(36) + Math.abs(hash * 31).toString(36);
  }

  function genSalt(): string { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function genToken(): string { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }

  lispDefineJs('auth/register', (username: string, password: string, ...roles: string[]) => {
    if (users.has(username)) return 'ERROR: User already exists';
    const salt = genSalt();
    users.set(username, { hash: hashPassword(password, salt), salt, roles: roles.length ? roles : ['user'], created: Date.now(), locked: false, attempts: 0 });
    return `User ${username} registered with roles: ${roles.length ? roles.join(',') : 'user'}`;
  });

  lispDefineJs('auth/login', (username: string, password: string, ip?: string) => {
    const user = users.get(username);
    if (!user) return 'ERROR: Invalid credentials';
    if (user.locked) return 'ERROR: Account locked';
    if (hashPassword(password, user.salt) !== user.hash) {
      user.attempts++;
      if (user.attempts >= 5) user.locked = true;
      return 'ERROR: Invalid credentials';
    }
    user.attempts = 0;
    const token = genToken();
    sessions.set(token, { user: username, expires: Date.now() + 3600000, ip: ip || '0.0.0.0' });
    return token;
  });

  lispDefineJs('auth/verify', (token: string) => {
    const session = sessions.get(token);
    if (!session || session.expires < Date.now()) { sessions.delete(token); return null; }
    return session.user;
  });

  lispDefineJs('auth/logout', (token: string) => { sessions.delete(token); return 'Logged out'; });
  lispDefineJs('auth/change-password', (username: string, oldPass: string, newPass: string) => {
    const user = users.get(username);
    if (!user || hashPassword(oldPass, user.salt) !== user.hash) return 'ERROR: Invalid credentials';
    const salt = genSalt();
    user.salt = salt;
    user.hash = hashPassword(newPass, salt);
    return 'Password changed';
  });
  lispDefineJs('auth/has-role', (username: string, role: string) => {
    const user = users.get(username);
    return user ? user.roles.includes(role) : false;
  });
  lispDefineJs('auth/add-role', (username: string, role: string) => {
    const user = users.get(username);
    if (!user) return 'ERROR: User not found';
    if (!user.roles.includes(role)) user.roles.push(role);
    return `Role ${role} added to ${username}`;
  });
  lispDefineJs('auth/unlock', (username: string) => {
    const user = users.get(username);
    if (!user) return 'ERROR: User not found';
    user.locked = false; user.attempts = 0;
    return `${username} unlocked`;
  });
  lispDefineJs('auth/gen-api-key', (username: string, type?: string) => {
    const t = genToken();
    tokens.set(t, { user: username, type: type || 'api', expires: Date.now() + 86400000 * 30 });
    return t;
  });
  lispDefineJs('auth/verify-api-key', (key: string) => {
    const t = tokens.get(key);
    if (!t || t.expires < Date.now()) return null;
    return t.user;
  });
  lispDefineJs('auth/list-users', () => Array.from(users.keys()).join(', '));
  lispDefineJs('auth/user-info', (username: string) => {
    const u = users.get(username);
    if (!u) return null;
    return JSON.stringify({ roles: u.roles, created: u.created, locked: u.locked });
  });
}

// ==================== WEB PROJECT SKELETONS & GENERATORS ====================
function registerWebModule() {
  lispDefineJs('web/gen-html', (title: string, body: string) =>
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link href="https://cdn.tailwindcss.com" rel="stylesheet"></head><body class="bg-gray-900 text-white">${body}</body></html>`);

  lispDefineJs('web/gen-component', (cName: string, props: string) =>
    `import React from 'react';\n\ninterface ${cName}Props {\n  ${props}\n}\n\nexport const ${cName}: React.FC<${cName}Props> = (props) => {\n  return (\n    <div className="p-4">\n      <h2>${cName}</h2>\n    </div>\n  );\n};\n\nexport default ${cName};`);

  lispDefineJs('web/gen-api-route', (method: string, path: string, handler: string) =>
    `app.${method.toLowerCase()}('${path}', async (req, res) => {\n  try {\n    ${handler}\n  } catch (err) {\n    res.status(500).json({ error: err.message });\n  }\n});`);

  lispDefineJs('web/gen-express-app', (name: string) =>
    `const express = require('express');\nconst cors = require('cors');\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\napp.get('/', (req, res) => res.json({ name: '${name}', status: 'running' }));\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => console.log('[${name}] Running on port ' + PORT));`);

  lispDefineJs('web/gen-dockerfile', (_name: string, port: string) =>
    `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --production\nCOPY . .\nEXPOSE ${port}\nCMD ["node", "server.js"]`);

  lispDefineJs('web/gen-nginx-conf', (domain: string, port: string) =>
    `server {\n  listen 80;\n  server_name ${domain};\n  location / {\n    proxy_pass http://localhost:${port};\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection 'upgrade';\n    proxy_set_header Host $host;\n    proxy_cache_bypass $http_upgrade;\n  }\n}`);

  lispDefineJs('web/gen-package-json', (name: string, deps: string) =>
    JSON.stringify({ name, version: '1.0.0', main: 'server.js', scripts: { start: 'node server.js', dev: 'nodemon server.js' }, dependencies: Object.fromEntries((deps || 'express,cors').split(',').map(d => [d.trim(), 'latest'])) }, null, 2));

  lispDefineJs('web/gen-rest-crud', (resource: string) => {
    const R = resource.charAt(0).toUpperCase() + resource.slice(1);
    return `// ${R} CRUD\nconst ${resource}s = [];\napp.get('/${resource}s', (req, res) => res.json(${resource}s));\napp.get('/${resource}s/:id', (req, res) => res.json(${resource}s.find(i => i.id === req.params.id)));\napp.post('/${resource}s', (req, res) => { const item = { id: Date.now().toString(), ...req.body }; ${resource}s.push(item); res.status(201).json(item); });\napp.put('/${resource}s/:id', (req, res) => { const idx = ${resource}s.findIndex(i => i.id === req.params.id); if(idx>=0) { ${resource}s[idx] = { ...${resource}s[idx], ...req.body }; res.json(${resource}s[idx]); } else res.status(404).json({error:'Not found'}); });\napp.delete('/${resource}s/:id', (req, res) => { const idx = ${resource}s.findIndex(i => i.id === req.params.id); if(idx>=0) { ${resource}s.splice(idx,1); res.status(204).end(); } else res.status(404).json({error:'Not found'}); });`;
  });
}

// ==================== EMAIL ====================
function registerEmailModule() {
  lispDefineJs('email/compose', (to: string, subject: string, body: string, from?: string) =>
    JSON.stringify({ from: from || 'noreply@whoamisec.pro', to, subject, body, date: new Date().toISOString(), headers: { 'X-Mailer': 'WHOAMISEC-LISP-Engine/1.0', 'MIME-Version': '1.0', 'Content-Type': 'text/html; charset=UTF-8' } }));

  lispDefineJs('email/gen-smtp-payload', (to: string, from: string, subject: string, body: string) =>
    `EHLO whoamisec.pro\r\nMAIL FROM:<${from}>\r\nRCPT TO:<${to}>\r\nDATA\r\nFrom: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html\r\n\r\n${body}\r\n.\r\nQUIT`);

  lispDefineJs('email/parse-address', (addr: string) => {
    const m = addr.match(/^(?:(.+?)\s*)?<?([^>]+@[^>]+)>?$/);
    return m ? JSON.stringify({ name: m[1] || '', address: m[2] }) : addr;
  });

  lispDefineJs('email/gen-mime', (parts: string) => {
    const boundary = '----=_Part_' + Date.now();
    return `MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n--${boundary}\r\n${parts}\r\n--${boundary}--`;
  });

  lispDefineJs('email/validate', (addr: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr));
  lispDefineJs('email/extract-domain', (addr: string) => addr.split('@')[1] || '');
  lispDefineJs('email/gen-phishing-template', (target: string, lure: string) =>
    `<html><body style="font-family:Arial"><p>Dear ${target},</p><p>${lure}</p><p><a href="https://whoamisec.pro/verify">Click here to verify</a></p><p>Best regards,<br>Security Team</p></body></html>`);
}

// ==================== OPENAPI / ODATA / OPENRPC ====================
function registerApiModule() {
  lispDefineJs('api/gen-openapi', (title: string, version: string, paths: string) =>
    JSON.stringify({ openapi: '3.0.3', info: { title, version, description: `${title} API — Generated by WHOAMISEC LISP Engine` }, servers: [{ url: 'http://localhost:3000' }], paths: JSON.parse(paths || '{}') }, null, 2));

  lispDefineJs('api/gen-endpoint', (method: string, path: string, summary: string, responseSchema: string) =>
    JSON.stringify({ [path]: { [method.toLowerCase()]: { summary, operationId: path.replace(/\//g, '_').replace(/[{}:]/g, ''), responses: { '200': { description: 'Success', content: { 'application/json': { schema: JSON.parse(responseSchema || '{"type":"object"}') } } } } } } }));

  lispDefineJs('api/gen-odata-query', (entity: string, filter?: string, select?: string, orderby?: string, top?: string) => {
    let q = `/${entity}?`;
    if (filter) q += `$filter=${encodeURIComponent(filter)}&`;
    if (select) q += `$select=${select}&`;
    if (orderby) q += `$orderby=${orderby}&`;
    if (top) q += `$top=${top}&`;
    return q.replace(/&$/, '');
  });

  lispDefineJs('api/gen-graphql-schema', (typeName: string, fields: string) =>
    `type ${typeName} {\n${fields.split(',').map((f: string) => `  ${f.trim()}`).join('\n')}\n}\n\ntype Query {\n  ${typeName.toLowerCase()}s: [${typeName}!]!\n  ${typeName.toLowerCase()}(id: ID!): ${typeName}\n}\n\ntype Mutation {\n  create${typeName}(input: ${typeName}Input!): ${typeName}!\n  update${typeName}(id: ID!, input: ${typeName}Input!): ${typeName}!\n  delete${typeName}(id: ID!): Boolean!\n}`);

  lispDefineJs('api/gen-openrpc', (name: string, methods: string) =>
    JSON.stringify({ openrpc: '1.2.6', info: { title: name, version: '1.0.0' }, methods: JSON.parse(methods || '[]') }, null, 2));

  lispDefineJs('api/curl', (method: string, url: string, data?: string, headers?: string) =>
    `curl -X ${method.toUpperCase()} '${url}'${headers ? ` -H '${headers}'` : ''}${data ? ` -d '${data}'` : ''}`);
}

// ==================== STATIC SITE GENERATORS ====================
function registerStaticSiteModule() {
  lispDefineJs('ssg/gen-page', (title: string, content: string, template?: string) => {
    const tpl = template || 'default';
    return `---\ntitle: "${title}"\ntemplate: ${tpl}\ndate: ${new Date().toISOString()}\n---\n\n# ${title}\n\n${content}`;
  });

  lispDefineJs('ssg/gen-blog-post', (title: string, author: string, tags: string, content: string) =>
    `---\ntitle: "${title}"\nauthor: "${author}"\ndate: ${new Date().toISOString()}\ntags: [${tags.split(',').map((t: string) => `"${t.trim()}"`).join(', ')}]\ndraft: false\n---\n\n${content}`);

  lispDefineJs('ssg/gen-sitemap', (...urls: string[]) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u: string) => `  <url><loc>${u}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod></url>`).join('\n')}\n</urlset>`);

  lispDefineJs('ssg/gen-rss', (title: string, link: string, items: string) =>
    `<?xml version="1.0"?>\n<rss version="2.0"><channel><title>${title}</title><link>${link}</link>${items}</channel></rss>`);

  lispDefineJs('ssg/markdown-to-html', (md: string) =>
    md.replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>'));
}

// ==================== NUMERICAL & SCIENTIFIC ====================
function registerNumericalModule() {
  lispDefineJs('math/factorial', (n: number): number => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; });
  lispDefineJs('math/fibonacci', (n: number): number => { let a = 0, b = 1; for (let i = 0; i < n; i++) { const t = b; b = a + b; a = t; } return a; });
  lispDefineJs('math/gcd', (a: number, b: number): number => { while (b) { const t = b; b = a % b; a = t; } return a; });
  lispDefineJs('math/lcm', (a: number, b: number): number => Math.abs(a * b) / (function gcd(x: number, y: number): number { return y ? gcd(y, x % y) : x; })(a, b));
  lispDefineJs('math/is-prime', (n: number): boolean => { if (n < 2) return false; for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false; return true; });
  lispDefineJs('math/primes-up-to', (n: number) => { const r: number[] = []; for (let i = 2; i <= n; i++) { let p = true; for (let j = 2; j <= Math.sqrt(i); j++) if (i % j === 0) { p = false; break; } if (p) r.push(i); } return r.join(','); });
  lispDefineJs('math/sin', (x: number) => Math.sin(x));
  lispDefineJs('math/cos', (x: number) => Math.cos(x));
  lispDefineJs('math/tan', (x: number) => Math.tan(x));
  lispDefineJs('math/asin', (x: number) => Math.asin(x));
  lispDefineJs('math/acos', (x: number) => Math.acos(x));
  lispDefineJs('math/atan', (x: number) => Math.atan(x));
  lispDefineJs('math/atan2', (y: number, x: number) => Math.atan2(y, x));
  lispDefineJs('math/log', (x: number) => Math.log(x));
  lispDefineJs('math/log2', (x: number) => Math.log2(x));
  lispDefineJs('math/log10', (x: number) => Math.log10(x));
  lispDefineJs('math/exp', (x: number) => Math.exp(x));
  lispDefineJs('math/deg->rad', (d: number) => d * Math.PI / 180);
  lispDefineJs('math/rad->deg', (r: number) => r * 180 / Math.PI);
  lispDefineJs('math/lerp', (a: number, b: number, t: number) => a + (b - a) * t);
  lispDefineJs('math/clamp', (val: number, min: number, max: number) => Math.max(min, Math.min(max, val)));
  lispDefineJs('math/sigmoid', (x: number) => 1 / (1 + Math.exp(-x)));
  lispDefineJs('math/relu', (x: number) => Math.max(0, x));
  lispDefineJs('math/softmax', (values: string) => {
    const nums = values.split(',').map(Number);
    const max = Math.max(...nums);
    const exps = nums.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => (e / sum).toFixed(6)).join(',');
  });
  lispDefineJs('math/fft-magnitude', (reals: string) => {
    const nums = reals.split(',').map(Number);
    return nums.map((_, i) => {
      let re = 0, im = 0;
      for (let n = 0; n < nums.length; n++) {
        const angle = -2 * Math.PI * i * n / nums.length;
        re += nums[n] * Math.cos(angle);
        im += nums[n] * Math.sin(angle);
      }
      return Math.sqrt(re * re + im * im).toFixed(4);
    }).join(',');
  });
}

// ==================== MATRIX LIBRARIES ====================
function registerMatrixModule() {
  type Mat = number[][];
  const parseMat = (s: string): Mat => JSON.parse(s);
  const matStr = (m: Mat): string => JSON.stringify(m);

  lispDefineJs('matrix/create', (rows: number, cols: number, fill?: number) =>
    matStr(Array.from({ length: rows }, () => Array(cols).fill(fill || 0))));

  lispDefineJs('matrix/identity', (n: number) =>
    matStr(Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0))));

  lispDefineJs('matrix/add', (a: string, b: string) => {
    const ma = parseMat(a), mb = parseMat(b);
    return matStr(ma.map((row, i) => row.map((v, j) => v + mb[i][j])));
  });

  lispDefineJs('matrix/mul', (a: string, b: string) => {
    const ma = parseMat(a), mb = parseMat(b);
    const rows = ma.length, cols = mb[0].length, inner = mb.length;
    const result: Mat = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++)
        for (let k = 0; k < inner; k++)
          result[i][j] += ma[i][k] * mb[k][j];
    return matStr(result);
  });

  lispDefineJs('matrix/transpose', (a: string) => {
    const m = parseMat(a);
    return matStr(m[0].map((_, j) => m.map(row => row[j])));
  });

  lispDefineJs('matrix/determinant', (a: string): number => {
    const m = parseMat(a);
    if (m.length === 1) return m[0][0];
    if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    let det = 0;
    for (let j = 0; j < m.length; j++) {
      const sub = m.slice(1).map(row => [...row.slice(0, j), ...row.slice(j + 1)]);
      det += (j % 2 === 0 ? 1 : -1) * m[0][j] * (function d(mat: Mat): number {
        if (mat.length === 1) return mat[0][0];
        if (mat.length === 2) return mat[0][0] * mat[1][1] - mat[0][1] * mat[1][0];
        let r = 0;
        for (let i = 0; i < mat.length; i++) {
          const s = mat.slice(1).map(row => [...row.slice(0, i), ...row.slice(i + 1)]);
          r += (i % 2 === 0 ? 1 : -1) * mat[0][i] * d(s);
        }
        return r;
      })(sub);
    }
    return det;
  });

  lispDefineJs('matrix/scalar-mul', (a: string, s: number) => {
    const m = parseMat(a);
    return matStr(m.map(row => row.map(v => v * s)));
  });

  lispDefineJs('matrix/dot', (a: string, b: string) => {
    const va = a.split(',').map(Number), vb = b.split(',').map(Number);
    return va.reduce((s, v, i) => s + v * vb[i], 0);
  });

  lispDefineJs('matrix/cross', (a: string, b: string) => {
    const va = a.split(',').map(Number), vb = b.split(',').map(Number);
    return [va[1]*vb[2]-va[2]*vb[1], va[2]*vb[0]-va[0]*vb[2], va[0]*vb[1]-va[1]*vb[0]].join(',');
  });

  lispDefineJs('matrix/norm', (a: string) => {
    const v = a.split(',').map(Number);
    return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  });
}

// ==================== STATISTICS ====================
function registerStatsModule() {
  const nums = (s: string) => s.split(',').map(Number);

  lispDefineJs('stats/mean', (data: string) => { const n = nums(data); return n.reduce((a, b) => a + b, 0) / n.length; });
  lispDefineJs('stats/median', (data: string) => { const n = nums(data).sort((a, b) => a - b); const mid = Math.floor(n.length / 2); return n.length % 2 ? n[mid] : (n[mid - 1] + n[mid]) / 2; });
  lispDefineJs('stats/mode', (data: string) => { const n = nums(data); const freq: Record<number, number> = {}; n.forEach(v => freq[v] = (freq[v] || 0) + 1); return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]); });
  lispDefineJs('stats/variance', (data: string) => { const n = nums(data); const m = n.reduce((a, b) => a + b, 0) / n.length; return n.reduce((a, v) => a + (v - m) ** 2, 0) / n.length; });
  lispDefineJs('stats/stddev', (data: string) => { const n = nums(data); const m = n.reduce((a, b) => a + b, 0) / n.length; return Math.sqrt(n.reduce((a, v) => a + (v - m) ** 2, 0) / n.length); });
  lispDefineJs('stats/percentile', (data: string, p: number) => { const n = nums(data).sort((a, b) => a - b); const idx = (p / 100) * (n.length - 1); const lo = Math.floor(idx); return lo === idx ? n[lo] : n[lo] + (n[lo + 1] - n[lo]) * (idx - lo); });
  lispDefineJs('stats/correlation', (xs: string, ys: string) => {
    const x = nums(xs), y = nums(ys);
    const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
    const num = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0);
    const dx = Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0));
    const dy = Math.sqrt(y.reduce((s, v) => s + (v - my) ** 2, 0));
    return num / (dx * dy);
  });
  lispDefineJs('stats/linear-regression', (xs: string, ys: string) => {
    const x = nums(xs), y = nums(ys), n = x.length;
    const sx = x.reduce((a, b) => a + b, 0), sy = y.reduce((a, b) => a + b, 0);
    const sxy = x.reduce((s, v, i) => s + v * y[i], 0), sx2 = x.reduce((s, v) => s + v * v, 0);
    const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
    const intercept = (sy - slope * sx) / n;
    return JSON.stringify({ slope, intercept, equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}` });
  });
  lispDefineJs('stats/histogram', (data: string, bins: number) => {
    const n = nums(data), min = Math.min(...n), max = Math.max(...n), w = (max - min) / bins;
    const counts = Array(bins).fill(0);
    n.forEach(v => { const b = Math.min(Math.floor((v - min) / w), bins - 1); counts[b]++; });
    return counts.join(',');
  });
  lispDefineJs('stats/z-score', (value: number, mean: number, stddev: number) => (value - mean) / stddev);
  lispDefineJs('stats/covariance', (xs: string, ys: string) => {
    const x = nums(xs), y = nums(ys);
    const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
    return x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / x.length;
  });
}

// ==================== UNITS ====================
function registerUnitsModule() {
  const conversions: Record<string, Record<string, number>> = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144, nm: 1852, ly: 9.461e15 },
    mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000, st: 6.35029 },
    time: { s: 1, ms: 0.001, us: 0.000001, min: 60, h: 3600, d: 86400, wk: 604800, yr: 31557600 },
    temp: { C: 1, F: 1, K: 1 },
    data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: 0.125 },
    speed: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444, c: 299792458, mach: 343 },
    energy: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, eV: 1.602e-19, kWh: 3600000 },
    pressure: { Pa: 1, kPa: 1000, bar: 100000, atm: 101325, psi: 6894.76, mmHg: 133.322 },
  };

  lispDefineJs('units/convert', (value: number, from: string, to: string) => {
    // Temperature special handling
    if ((from === 'C' || from === 'F' || from === 'K') && (to === 'C' || to === 'F' || to === 'K')) {
      let celsius = value;
      if (from === 'F') celsius = (value - 32) * 5 / 9;
      else if (from === 'K') celsius = value - 273.15;
      if (to === 'C') return celsius;
      if (to === 'F') return celsius * 9 / 5 + 32;
      return celsius + 273.15;
    }
    for (const cat of Object.values(conversions)) {
      if (cat[from] !== undefined && cat[to] !== undefined) {
        return value * cat[from] / cat[to];
      }
    }
    return `Cannot convert ${from} to ${to}`;
  });

  lispDefineJs('units/list-categories', () => Object.keys(conversions).join(','));
  lispDefineJs('units/list-units', (category: string) => Object.keys(conversions[category] || {}).join(','));
}

// ==================== PARALLELISM & CONCURRENCY ====================
function registerConcurrencyModule() {
  const channels: Map<string, any[]> = new Map();
  const actors: Map<string, { mailbox: any[]; handler: string }> = new Map();
  const jobs: Map<string, { status: string; result: any; created: number; fn: string }> = new Map();
  const events: Map<string, ((data: any) => void)[]> = new Map();

  // Channels
  lispDefineJs('chan/create', (name: string) => { channels.set(name, []); return name; });
  lispDefineJs('chan/send', (name: string, data: string) => { const ch = channels.get(name); if (ch) { ch.push(data); return true; } return false; });
  lispDefineJs('chan/recv', (name: string) => { const ch = channels.get(name); return ch && ch.length > 0 ? ch.shift() : null; });
  lispDefineJs('chan/peek', (name: string) => { const ch = channels.get(name); return ch && ch.length > 0 ? ch[0] : null; });
  lispDefineJs('chan/size', (name: string) => { const ch = channels.get(name); return ch ? ch.length : 0; });
  lispDefineJs('chan/close', (name: string) => { channels.delete(name); return true; });

  // Actors
  lispDefineJs('actor/create', (name: string, handler: string) => { actors.set(name, { mailbox: [], handler }); return name; });
  lispDefineJs('actor/send', (name: string, message: string) => { const a = actors.get(name); if (a) { a.mailbox.push(message); return true; } return false; });
  lispDefineJs('actor/process', (name: string) => {
    const a = actors.get(name);
    if (!a || a.mailbox.length === 0) return null;
    const msg = a.mailbox.shift();
    const result = lispApiEval(`(${a.handler} "${msg}")`);
    return result.error || result.output.join('\n') || 'processed';
  });
  lispDefineJs('actor/list', () => Array.from(actors.keys()).join(','));

  // Events
  lispDefineJs('event/on', (name: string, handlerCode: string) => {
    if (!events.has(name)) events.set(name, []);
    events.get(name)!.push((data: any) => lispApiEval(`(${handlerCode} "${data}")`));
    return `Listener added for ${name}`;
  });
  lispDefineJs('event/emit', (name: string, data: string) => {
    const handlers = events.get(name);
    if (!handlers) return 0;
    handlers.forEach(h => h(data));
    return handlers.length;
  });
  lispDefineJs('event/off', (name: string) => { events.delete(name); return true; });

  // Jobs
  lispDefineJs('job/create', (id: string, code: string) => {
    jobs.set(id, { status: 'pending', result: null, created: Date.now(), fn: code });
    return id;
  });
  lispDefineJs('job/run', (id: string) => {
    const job = jobs.get(id);
    if (!job) return 'ERROR: Job not found';
    job.status = 'running';
    const result = lispApiEval(job.fn);
    job.status = result.error ? 'failed' : 'completed';
    job.result = result.error || result.output.join('\n') || 'done';
    return job.result;
  });
  lispDefineJs('job/status', (id: string) => { const j = jobs.get(id); return j ? j.status : 'not_found'; });
  lispDefineJs('job/result', (id: string) => { const j = jobs.get(id); return j ? j.result : null; });
  lispDefineJs('job/list', () => Array.from(jobs.entries()).map(([id, j]) => `${id}:${j.status}`).join(','));
}

// ==================== REGEX & STRING PARSING ====================
function registerRegexModule() {
  lispDefineJs('regex/match', (pattern: string, text: string) => { const m = text.match(new RegExp(pattern)); return m ? m[0] : null; });
  lispDefineJs('regex/match-all', (pattern: string, text: string) => { const m = [...text.matchAll(new RegExp(pattern, 'g'))]; return m.map(x => x[0]).join(','); });
  lispDefineJs('regex/test', (pattern: string, text: string) => new RegExp(pattern).test(text));
  lispDefineJs('regex/replace', (pattern: string, replacement: string, text: string) => text.replace(new RegExp(pattern, 'g'), replacement));
  lispDefineJs('regex/split', (pattern: string, text: string) => text.split(new RegExp(pattern)).join(','));
  lispDefineJs('regex/groups', (pattern: string, text: string) => {
    const m = text.match(new RegExp(pattern));
    return m ? JSON.stringify(m.slice(1)) : '[]';
  });
  lispDefineJs('regex/extract-emails', (text: string) => (text.match(/[\w.-]+@[\w.-]+\.\w+/g) || []).join(','));
  lispDefineJs('regex/extract-urls', (text: string) => (text.match(/https?:\/\/[^\s<>"]+/g) || []).join(','));
  lispDefineJs('regex/extract-ips', (text: string) => (text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || []).join(','));
  lispDefineJs('regex/extract-phones', (text: string) => (text.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,}/g) || []).join(','));

  // CSV/TSV parser
  lispDefineJs('parse/csv', (text: string, delimiter?: string) => {
    const d = delimiter || ',';
    const rows = text.split('\n').map(r => r.split(d).map(c => c.trim()));
    return JSON.stringify(rows);
  });
  lispDefineJs('parse/ini', (text: string) => {
    const result: Record<string, Record<string, string>> = {};
    let section = 'default';
    text.split('\n').forEach(line => {
      const l = line.trim();
      if (l.startsWith('[') && l.endsWith(']')) { section = l.slice(1, -1); result[section] = result[section] || {}; }
      else if (l.includes('=') && !l.startsWith('#') && !l.startsWith(';')) {
        const [key, ...val] = l.split('=');
        result[section] = result[section] || {};
        result[section][key.trim()] = val.join('=').trim();
      }
    });
    return JSON.stringify(result);
  });
  lispDefineJs('parse/xml-tag', (tag: string, text: string) => {
    const m = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'));
    return m ? m.map(x => x.replace(new RegExp(`</?${tag}[^>]*>`, 'g'), '')).join(',') : '';
  });
}

// ==================== SCRIPTING & SHELL ====================
function registerScriptingModule() {
  lispDefineJs('script/gen-bash', (commands: string) =>
    `#!/bin/bash\nset -euo pipefail\n\n${commands}`);
  lispDefineJs('script/gen-python', (code: string) =>
    `#!/usr/bin/env python3\n# Generated by WHOAMISEC LISP Engine\n\n${code}\n\nif __name__ == '__main__':\n    main()`);
  lispDefineJs('script/gen-powershell', (code: string) =>
    `# PowerShell script — WHOAMISEC LISP Engine\nSet-StrictMode -Version Latest\n$ErrorActionPreference = 'Stop'\n\n${code}`);

  // CLI args parser
  lispDefineJs('cli/parse-args', (args: string) => {
    const result: Record<string, string> = {};
    const parts = args.split(' ');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('--')) {
        const key = parts[i].slice(2);
        result[key] = parts[i + 1] && !parts[i + 1].startsWith('-') ? parts[++i] : 'true';
      } else if (parts[i].startsWith('-')) {
        const key = parts[i].slice(1);
        result[key] = parts[i + 1] && !parts[i + 1].startsWith('-') ? parts[++i] : 'true';
      }
    }
    return JSON.stringify(result);
  });

  lispDefineJs('cli/gen-help', (name: string, description: string, options: string) =>
    `Usage: ${name} [OPTIONS]\n\n${description}\n\nOptions:\n${options.split(',').map((o: string) => `  ${o.trim()}`).join('\n')}\n\nGenerated by WHOAMISEC LISP Engine`);

  lispDefineJs('shell/escape', (cmd: string) => cmd.replace(/([`$\\"])/g, '\\$1'));
  lispDefineJs('shell/quote', (arg: string) => `'${arg.replace(/'/g, "'\\''")}'`);
  lispDefineJs('shell/pipe', (...commands: string[]) => commands.join(' | '));
  lispDefineJs('shell/and', (...commands: string[]) => commands.join(' && '));

  // System admin
  lispDefineJs('sysadmin/gen-cron', (minute: string, hour: string, dom: string, month: string, dow: string, cmd: string) =>
    `${minute} ${hour} ${dom} ${month} ${dow} ${cmd}`);
  lispDefineJs('sysadmin/gen-systemd', (name: string, exec: string, user?: string) =>
    `[Unit]\nDescription=${name}\nAfter=network.target\n\n[Service]\nType=simple\nUser=${user || 'root'}\nExecStart=${exec}\nRestart=always\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target`);
  lispDefineJs('sysadmin/gen-iptables', (action: string, proto: string, port: string, source?: string) =>
    `iptables -A INPUT -p ${proto} --dport ${port}${source ? ` -s ${source}` : ''} -j ${action.toUpperCase()}`);
}

// ==================== TESTING ====================
function registerTestingModule() {
  const testResults: { name: string; passed: boolean; message: string; elapsed: number }[] = [];
  let testSuite = '';

  lispDefineJs('test/suite', (name: string) => { testSuite = name; testResults.length = 0; return `Test suite: ${name}`; });
  lispDefineJs('test/assert', (name: string, expr: string) => {
    const start = performance.now();
    const result = lispApiEval(expr);
    const passed = !result.error && result.value.type === 'bool' && (result.value as any).value === true;
    testResults.push({ name, passed, message: passed ? 'PASS' : (result.error || 'FAIL'), elapsed: performance.now() - start });
    return passed ? `✓ ${name}` : `✗ ${name}: ${result.error || 'assertion failed'}`;
  });
  lispDefineJs('test/assert-eq', (name: string, a: string, b: string) => {
    const start = performance.now();
    const ra = lispApiEval(a), rb = lispApiEval(b);
    const av = ra.error ? 'ERROR' : JSON.stringify(ra.value), bv = rb.error ? 'ERROR' : JSON.stringify(rb.value);
    const passed = av === bv;
    testResults.push({ name, passed, message: passed ? 'PASS' : `Expected ${bv}, got ${av}`, elapsed: performance.now() - start });
    return passed ? `✓ ${name}` : `✗ ${name}: expected ${bv}, got ${av}`;
  });
  lispDefineJs('test/assert-throws', (name: string, expr: string) => {
    const start = performance.now();
    const result = lispApiEval(expr);
    const passed = !!result.error;
    testResults.push({ name, passed, message: passed ? 'PASS (threw)' : 'FAIL (no error)', elapsed: performance.now() - start });
    return passed ? `✓ ${name} (threw as expected)` : `✗ ${name}: expected error`;
  });
  lispDefineJs('test/report', () => {
    const total = testResults.length, passed = testResults.filter(t => t.passed).length;
    const elapsed = testResults.reduce((s, t) => s + t.elapsed, 0);
    return `\n[${testSuite}] ${passed}/${total} passed (${elapsed.toFixed(2)}ms)\n${testResults.map(t => `  ${t.passed ? '✓' : '✗'} ${t.name} (${t.elapsed.toFixed(2)}ms)`).join('\n')}`;
  });
  lispDefineJs('test/clear', () => { testResults.length = 0; return 'Tests cleared'; });
}

// ==================== CACHING ====================
function registerCachingModule() {
  const cache: Map<string, { value: any; expires: number; hits: number }> = new Map();
  const memoCache: Map<string, any> = new Map();

  lispDefineJs('cache/set', (key: string, value: string, ttl?: number) => {
    cache.set(key, { value, expires: ttl ? Date.now() + ttl * 1000 : Infinity, hits: 0 });
    return value;
  });
  lispDefineJs('cache/get', (key: string) => {
    const entry = cache.get(key);
    if (!entry || entry.expires < Date.now()) { cache.delete(key); return null; }
    entry.hits++;
    return entry.value;
  });
  lispDefineJs('cache/del', (key: string) => { cache.delete(key); return true; });
  lispDefineJs('cache/clear', () => { cache.clear(); return true; });
  lispDefineJs('cache/keys', () => Array.from(cache.keys()).join(','));
  lispDefineJs('cache/stats', () => {
    const entries = Array.from(cache.entries());
    return JSON.stringify({ size: entries.length, totalHits: entries.reduce((s, [, v]) => s + v.hits, 0) });
  });

  // Memoization
  lispDefineJs('memo/call', (fnCode: string, ...args: any[]) => {
    const key = fnCode + '|' + JSON.stringify(args);
    if (memoCache.has(key)) return memoCache.get(key);
    const result = lispApiEval(`(${fnCode} ${args.map((a: any) => typeof a === 'string' ? `"${a}"` : a).join(' ')})`);
    const val = result.error || result.output.join('') || JSON.stringify(result.value);
    memoCache.set(key, val);
    return val;
  });
  lispDefineJs('memo/clear', () => { memoCache.clear(); return true; });
}

// ==================== COMPRESSION ====================
function registerCompressionModule() {
  lispDefineJs('compress/rle-encode', (data: string) => {
    let result = '', count = 1;
    for (let i = 1; i <= data.length; i++) {
      if (i < data.length && data[i] === data[i - 1]) count++;
      else { result += (count > 1 ? count : '') + data[i - 1]; count = 1; }
    }
    return result;
  });
  lispDefineJs('compress/rle-decode', (data: string) => {
    let result = '';
    const m = data.match(/(\d*)([^\d])/g) || [];
    m.forEach(token => {
      const count = parseInt(token) || 1;
      result += token[token.length - 1].repeat(count);
    });
    return result;
  });
  lispDefineJs('compress/lz-simple', (data: string) => {
    const dict: Map<string, number> = new Map();
    let w = '', result: number[] = [], code = 256;
    for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i);
    for (const c of data) {
      const wc = w + c;
      if (dict.has(wc)) w = wc;
      else { result.push(dict.get(w)!); dict.set(wc, code++); w = c; }
    }
    if (w) result.push(dict.get(w)!);
    return result.join(',');
  });
}

// ==================== CONFIGURATION ====================
function registerConfigModule() {
  const config: Map<string, any> = new Map();

  lispDefineJs('config/set', (key: string, value: string) => { config.set(key, value); return value; });
  lispDefineJs('config/get', (key: string, defaultVal?: string) => config.get(key) || defaultVal || null);
  lispDefineJs('config/del', (key: string) => { config.delete(key); return true; });
  lispDefineJs('config/all', () => JSON.stringify(Object.fromEntries(config)));
  lispDefineJs('config/load-env', (envStr: string) => {
    envStr.split('\n').forEach(line => {
      const l = line.trim();
      if (l && !l.startsWith('#')) {
        const [key, ...val] = l.split('=');
        config.set(key.trim(), val.join('=').trim().replace(/^["']|["']$/g, ''));
      }
    });
    return `Loaded ${config.size} config values`;
  });
  lispDefineJs('config/gen-env', () => Array.from(config.entries()).map(([k, v]) => `${k}=${v}`).join('\n'));
  lispDefineJs('config/gen-yaml', () => Array.from(config.entries()).map(([k, v]) => `${k}: ${v}`).join('\n'));
  lispDefineJs('config/gen-toml', () => Array.from(config.entries()).map(([k, v]) => `${k} = "${v}"`).join('\n'));
}

// ==================== DATE & TIME ====================
function registerDateTimeModule() {
  lispDefineJs('dt/now', () => new Date().toISOString());
  lispDefineJs('dt/timestamp', () => Date.now());
  lispDefineJs('dt/format', (iso: string, fmt: string) => {
    const d = new Date(iso);
    return fmt.replace('YYYY', String(d.getFullYear())).replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0')).replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0')).replace('ss', String(d.getSeconds()).padStart(2, '0'));
  });
  lispDefineJs('dt/parse', (str: string) => new Date(str).toISOString());
  lispDefineJs('dt/add-days', (iso: string, days: number) => { const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString(); });
  lispDefineJs('dt/add-hours', (iso: string, hours: number) => { const d = new Date(iso); d.setHours(d.getHours() + hours); return d.toISOString(); });
  lispDefineJs('dt/diff-days', (a: string, b: string) => Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
  lispDefineJs('dt/diff-seconds', (a: string, b: string) => Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 1000));
  lispDefineJs('dt/day-of-week', (iso: string) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(iso).getDay()]);
  lispDefineJs('dt/is-leap-year', (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
  lispDefineJs('dt/unix->iso', (unix: number) => new Date(unix).toISOString());
  lispDefineJs('dt/iso->unix', (iso: string) => new Date(iso).getTime());
}

// ==================== DATA VALIDATION ====================
function registerValidationModule() {
  lispDefineJs('validate/email', (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
  lispDefineJs('validate/url', (v: string) => /^https?:\/\/[^\s]+$/.test(v));
  lispDefineJs('validate/ip', (v: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(v) && v.split('.').every((n: string) => parseInt(n) <= 255));
  lispDefineJs('validate/ipv6', (v: string) => /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v));
  lispDefineJs('validate/uuid', (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v));
  lispDefineJs('validate/hex', (v: string) => /^[0-9a-fA-F]+$/.test(v));
  lispDefineJs('validate/base64', (v: string) => /^[A-Za-z0-9+/]*={0,2}$/.test(v));
  lispDefineJs('validate/json', (v: string) => { try { JSON.parse(v); return true; } catch { return false; } });
  lispDefineJs('validate/number', (v: string) => !isNaN(Number(v)));
  lispDefineJs('validate/phone', (v: string) => /^\+?[\d\s\-()]{7,}$/.test(v));
  lispDefineJs('validate/credit-card', (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    for (let i = digits.length - 1, alt = false; i >= 0; i--, alt = !alt) {
      let n = parseInt(digits[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  });
  lispDefineJs('validate/password-strength', (v: string) => {
    let score = 0;
    if (v.length >= 8) score++; if (v.length >= 12) score++;
    if (/[a-z]/.test(v)) score++; if (/[A-Z]/.test(v)) score++;
    if (/\d/.test(v)) score++; if (/[^a-zA-Z0-9]/.test(v)) score++;
    return ['very-weak', 'weak', 'fair', 'good', 'strong', 'very-strong'][Math.min(score, 5)];
  });
  lispDefineJs('validate/mac-address', (v: string) => /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/.test(v));
  lispDefineJs('validate/domain', (v: string) => /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(v));
}

// ==================== FILES & DIRECTORIES ====================
function registerFileModule() {
  const vfs: Map<string, { content: string; created: number; modified: number; size: number }> = new Map();

  lispDefineJs('fs/write', (path: string, content: string) => {
    vfs.set(path, { content, created: vfs.get(path)?.created || Date.now(), modified: Date.now(), size: content.length });
    return `Written ${content.length} bytes to ${path}`;
  });
  lispDefineJs('fs/read', (path: string) => { const f = vfs.get(path); return f ? f.content : null; });
  lispDefineJs('fs/exists', (path: string) => vfs.has(path));
  lispDefineJs('fs/delete', (path: string) => { vfs.delete(path); return true; });
  lispDefineJs('fs/list', (prefix?: string) => Array.from(vfs.keys()).filter(k => !prefix || k.startsWith(prefix)).join(','));
  lispDefineJs('fs/stat', (path: string) => { const f = vfs.get(path); return f ? JSON.stringify({ size: f.size, created: f.created, modified: f.modified }) : null; });
  lispDefineJs('fs/copy', (src: string, dst: string) => { const f = vfs.get(src); if (f) { vfs.set(dst, { ...f, modified: Date.now() }); return true; } return false; });
  lispDefineJs('fs/move', (src: string, dst: string) => { const f = vfs.get(src); if (f) { vfs.set(dst, f); vfs.delete(src); return true; } return false; });
  lispDefineJs('fs/append', (path: string, content: string) => {
    const f = vfs.get(path);
    const newContent = (f ? f.content : '') + content;
    vfs.set(path, { content: newContent, created: f?.created || Date.now(), modified: Date.now(), size: newContent.length });
    return true;
  });
  lispDefineJs('fs/search', (pattern: string) => Array.from(vfs.keys()).filter(k => new RegExp(pattern).test(k)).join(','));
  lispDefineJs('fs/tree', () => {
    const paths = Array.from(vfs.keys()).sort();
    return paths.map(p => `  ${p} (${vfs.get(p)!.size}B)`).join('\n');
  });
}

// ==================== GIT ====================
function registerGitModule() {
  const gitLog: { hash: string; author: string; message: string; date: string; files: string[] }[] = [];
  const branches: Set<string> = new Set(['main']);
  let currentBranch = 'main';

  lispDefineJs('git/commit', (message: string, author?: string, ...files: string[]) => {
    const hash = Math.random().toString(36).slice(2, 10);
    gitLog.push({ hash, author: author || 'whoamisec', message, date: new Date().toISOString(), files });
    return `[${currentBranch} ${hash}] ${message}`;
  });
  lispDefineJs('git/log', (n?: number) => gitLog.slice(-(n || 10)).reverse().map(c => `${c.hash} ${c.author} ${c.message} (${c.date})`).join('\n'));
  lispDefineJs('git/branch', (name?: string) => { if (name) { branches.add(name); return `Branch ${name} created`; } return Array.from(branches).map(b => b === currentBranch ? `* ${b}` : `  ${b}`).join('\n'); });
  lispDefineJs('git/checkout', (branch: string) => { if (branches.has(branch)) { currentBranch = branch; return `Switched to ${branch}`; } return `ERROR: Branch ${branch} not found`; });
  lispDefineJs('git/diff', () => `diff --git\n--- a/\n+++ b/\n@@ Changes in ${currentBranch} @@\n+${gitLog.length} commits`);
  lispDefineJs('git/status', () => `On branch ${currentBranch}\n${gitLog.length} commits\nNothing to commit, working tree clean`);
}

// ==================== LOGGING ====================
function registerLoggingModule() {
  const logs: { level: string; message: string; timestamp: string; context?: string }[] = [];

  const log = (level: string) => (message: string, context?: string) => {
    logs.push({ level, message, timestamp: new Date().toISOString(), context });
    return `[${level}] ${message}`;
  };

  lispDefineJs('log/debug', log('DEBUG'));
  lispDefineJs('log/info', log('INFO'));
  lispDefineJs('log/warn', log('WARN'));
  lispDefineJs('log/error', log('ERROR'));
  lispDefineJs('log/fatal', log('FATAL'));
  lispDefineJs('log/all', () => logs.map(l => `${l.timestamp} [${l.level}] ${l.message}${l.context ? ` (${l.context})` : ''}`).join('\n'));
  lispDefineJs('log/filter', (level: string) => logs.filter(l => l.level === level.toUpperCase()).map(l => `${l.timestamp} ${l.message}`).join('\n'));
  lispDefineJs('log/clear', () => { logs.length = 0; return 'Logs cleared'; });
  lispDefineJs('log/count', () => logs.length);
  lispDefineJs('log/export-json', () => JSON.stringify(logs));
}

// ==================== MARKDOWN ====================
function registerMarkdownModule() {
  lispDefineJs('md/heading', (level: number, text: string) => '#'.repeat(level) + ' ' + text);
  lispDefineJs('md/bold', (text: string) => `**${text}**`);
  lispDefineJs('md/italic', (text: string) => `*${text}*`);
  lispDefineJs('md/code', (text: string, lang?: string) => `\`\`\`${lang || ''}\n${text}\n\`\`\``);
  lispDefineJs('md/link', (text: string, url: string) => `[${text}](${url})`);
  lispDefineJs('md/image', (alt: string, url: string) => `![${alt}](${url})`);
  lispDefineJs('md/table', (headers: string, ...rows: string[]) => {
    const h = headers.split(',');
    return `| ${h.join(' | ')} |\n| ${h.map(() => '---').join(' | ')} |\n${rows.map((r: string) => `| ${r.split(',').join(' | ')} |`).join('\n')}`;
  });
  lispDefineJs('md/list', (items: string, ordered?: string) => items.split(',').map((item: string, i: number) => ordered ? `${i + 1}. ${item.trim()}` : `- ${item.trim()}`).join('\n'));
  lispDefineJs('md/quote', (text: string) => text.split('\n').map((l: string) => `> ${l}`).join('\n'));
  lispDefineJs('md/hr', () => '\n---\n');
  lispDefineJs('md/checkbox', (text: string, checked?: string) => `- [${checked ? 'x' : ' '}] ${text}`);
  lispDefineJs('md/to-html', (md: string) => md.replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>'));
}

// ==================== PDF ====================
function registerPdfModule() {
  lispDefineJs('pdf/gen-text', (title: string, content: string) =>
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length ${content.length + 50}>>stream\nBT /F1 24 Tf 72 720 Td (${title}) Tj ET\nBT /F1 12 Tf 72 690 Td (${content}) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n0\n%%EOF`);
  lispDefineJs('pdf/gen-report', (title: string, sections: string) =>
    `[PDF Report: ${title}]\n${'='.repeat(60)}\n${sections.split('|').map((s: string) => `\n## ${s.trim()}\n${'─'.repeat(40)}`).join('\n')}\n\nGenerated: ${new Date().toISOString()}\nEngine: WHOAMISEC LISP`);
}

// ==================== SECURITY ====================
function registerSecurityModule() {
  lispDefineJs('sec/hash-simple', (data: string) => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) { hash = ((hash << 5) - hash) + data.charCodeAt(i); hash |= 0; }
    return Math.abs(hash).toString(16).padStart(8, '0');
  });
  lispDefineJs('sec/gen-uuid', () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }));
  lispDefineJs('sec/gen-password', (length: number) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let result = '';
    for (let i = 0; i < (length || 16); i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  });
  lispDefineJs('sec/gen-totp-secret', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  });
  lispDefineJs('sec/xor-cipher', (data: string, key: string) => {
    let result = '';
    for (let i = 0; i < data.length; i++) result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return btoa(result);
  });
  lispDefineJs('sec/rot13', (text: string) => text.replace(/[a-zA-Z]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))));
  lispDefineJs('sec/caesar', (text: string, shift: number) => text.replace(/[a-zA-Z]/g, (c: string) => { const base = c < 'a' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base); }));
  lispDefineJs('sec/entropy', (data: string) => {
    const freq: Record<string, number> = {};
    for (const c of data) freq[c] = (freq[c] || 0) + 1;
    const len = data.length;
    return -Object.values(freq).reduce((s, f) => { const p = f / len; return s + p * Math.log2(p); }, 0);
  });
  lispDefineJs('sec/gen-csp', (policies: string) => `Content-Security-Policy: ${policies}`);
  lispDefineJs('sec/gen-jwt-header', () => btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  lispDefineJs('sec/sanitize-html', (html: string) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
  lispDefineJs('sec/escape-sql', (input: string) => input.replace(/'/g, "''").replace(/;/g, '').replace(/--/g, ''));
}

// ==================== I18N ====================
function registerI18nModule() {
  const translations: Map<string, Map<string, string>> = new Map();

  lispDefineJs('i18n/add', (locale: string, key: string, value: string) => {
    if (!translations.has(locale)) translations.set(locale, new Map());
    translations.get(locale)!.set(key, value);
    return `Added ${locale}:${key}`;
  });
  lispDefineJs('i18n/t', (locale: string, key: string, ...args: string[]) => {
    const t = translations.get(locale)?.get(key) || key;
    let result = t;
    args.forEach((a: string, i: number) => { result = result.replace(`{${i}}`, a); });
    return result;
  });
  lispDefineJs('i18n/locales', () => Array.from(translations.keys()).join(','));
  lispDefineJs('i18n/keys', (locale: string) => { const m = translations.get(locale); return m ? Array.from(m.keys()).join(',') : ''; });
  lispDefineJs('i18n/export', (locale: string) => { const m = translations.get(locale); return m ? JSON.stringify(Object.fromEntries(m)) : '{}'; });
}

// ==================== PLOTTING (Text-based) ====================
function registerPlottingModule() {
  lispDefineJs('plot/bar', (data: string, labels?: string) => {
    const vals = data.split(',').map(Number);
    const lbls = labels ? labels.split(',') : vals.map((_, i) => String(i));
    const max = Math.max(...vals);
    return vals.map((v, i) => `${(lbls[i] || '').padEnd(10)} ${'█'.repeat(Math.round(v / max * 40))} ${v}`).join('\n');
  });
  lispDefineJs('plot/line', (data: string, height?: number) => {
    const vals = data.split(',').map(Number);
    const h = height || 10, min = Math.min(...vals), max = Math.max(...vals);
    const rows: string[] = [];
    for (let y = h; y >= 0; y--) {
      let row = '';
      for (let x = 0; x < vals.length; x++) {
        const normalized = Math.round((vals[x] - min) / (max - min) * h);
        row += normalized === y ? '●' : normalized > y ? '│' : ' ';
      }
      rows.push(`${((min + (max - min) * y / h).toFixed(1)).padStart(8)} │${row}`);
    }
    rows.push('         └' + '─'.repeat(vals.length));
    return rows.join('\n');
  });
  lispDefineJs('plot/histogram-text', (data: string, bins?: number) => {
    const vals = data.split(',').map(Number), b = bins || 10;
    const min = Math.min(...vals), max = Math.max(...vals), w = (max - min) / b;
    const counts = Array(b).fill(0);
    vals.forEach(v => { const idx = Math.min(Math.floor((v - min) / w), b - 1); counts[idx]++; });
    const maxCount = Math.max(...counts);
    return counts.map((c, i) => `${(min + i * w).toFixed(1).padStart(8)}-${(min + (i + 1) * w).toFixed(1).padEnd(8)} ${'█'.repeat(Math.round(c / maxCount * 30))} ${c}`).join('\n');
  });
  lispDefineJs('plot/scatter', (xs: string, ys: string) => {
    const xv = xs.split(',').map(Number), yv = ys.split(',').map(Number);
    const w = 40, h = 15;
    const xmin = Math.min(...xv), xmax = Math.max(...xv), ymin = Math.min(...yv), ymax = Math.max(...yv);
    const grid = Array.from({ length: h + 1 }, () => Array(w + 1).fill(' '));
    xv.forEach((x, i) => {
      const px = Math.round((x - xmin) / (xmax - xmin) * w);
      const py = h - Math.round((yv[i] - ymin) / (ymax - ymin) * h);
      if (py >= 0 && py <= h && px >= 0 && px <= w) grid[py][px] = '●';
    });
    return grid.map(r => r.join('')).join('\n');
  });
}

// ==================== DOCUMENTATION BUILDERS ====================
function registerDocsModule() {
  lispDefineJs('docs/gen-readme', (rName: string, description: string, install: string, usage: string) =>
    `# ${rName}\n\n${description}\n\n## Installation\n\n\`\`\`\n${install}\n\`\`\`\n\n## Usage\n\n\`\`\`\n${usage}\n\`\`\`\n\n## License\n\nMIT\n\nGenerated by WHOAMISEC LISP Engine`);

  lispDefineJs('docs/gen-api-doc', (endpoint: string, method: string, description: string, params: string, response: string) =>
    `### ${method.toUpperCase()} ${endpoint}\n\n${description}\n\n**Parameters:**\n${params.split(',').map((p: string) => `- \`${p.trim()}\``).join('\n')}\n\n**Response:**\n\`\`\`json\n${response}\n\`\`\``);

  lispDefineJs('docs/gen-changelog', (version: string, date: string, changes: string) =>
    `## [${version}] - ${date}\n\n${changes.split(',').map((c: string) => `- ${c.trim()}`).join('\n')}`);

  lispDefineJs('docs/gen-jsdoc', (_name: string, params: string, returns: string, description: string) =>
    `/**\n * ${description}\n${params.split(',').map((p: string) => ` * @param {*} ${p.trim()}`).join('\n')}\n * @returns {${returns}}\n */`);
}

// ==================== MASTER REGISTRATION ====================
export function registerAllLispModules(): void {
  registerAuthModule();
  registerWebModule();
  registerEmailModule();
  registerApiModule();
  registerStaticSiteModule();
  registerNumericalModule();
  registerMatrixModule();
  registerStatsModule();
  registerUnitsModule();
  registerConcurrencyModule();
  registerRegexModule();
  registerScriptingModule();
  registerTestingModule();
  registerCachingModule();
  registerCompressionModule();
  registerConfigModule();
  registerDateTimeModule();
  registerValidationModule();
  registerFileModule();
  registerGitModule();
  registerLoggingModule();
  registerMarkdownModule();
  registerPdfModule();
  registerSecurityModule();
  registerI18nModule();
  registerPlottingModule();
  registerDocsModule();
  // Real algorithm implementations (ported from awesome-cl ecosystem)
  registerCryptoModule();    // SHA-256, HMAC, AES-128, RSA, DH, MD5, bcrypt, PBKDF2
  registerDatabaseModule();  // SQL engine, tables, indexes, joins, transactions, migrations
  registerAiMlModule();      // Neural nets, K-Means, Naive Bayes, Decision Tree, KNN, PCA, LinReg
  registerLispBreakerModules(); // Cisco LISP protocol, GNU CLISP exploitation, AI system breaker
}
