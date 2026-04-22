// ==================== REAL CRYPTO IMPLEMENTATIONS ====================
// Ported from Ironclad (CL), cl-bcrypt, cl-ssh-keys concepts
// Real SHA-256, HMAC-SHA256, AES-128 (ECB), RSA primitives, DH key exchange, bcrypt-like, PBKDF2

import { lispDefineJs } from './lispService';

// ==================== SHA-256 (Real Implementation) ====================
function sha256(message: string): string {
  const K: number[] = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];

  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const bytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    const c = message.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) { bytes.push((c >> 6) | 192); bytes.push((c & 63) | 128); }
    else { bytes.push((c >> 12) | 224); bytes.push(((c >> 6) & 63) | 128); bytes.push((c & 63) | 128); }
  }

  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 56; i >= 0; i -= 8) bytes.push((bitLen >>> i) & 0xff);

  function rotr(n: number, x: number): number { return (x >>> n) | (x << (32 - n)); }
  function ch(x: number, y: number, z: number): number { return (x & y) ^ (~x & z); }
  function maj(x: number, y: number, z: number): number { return (x & y) ^ (x & z) ^ (y & z); }
  function sigma0(x: number): number { return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x); }
  function sigma1(x: number): number { return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x); }
  function gamma0(x: number): number { return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3); }
  function gamma1(x: number): number { return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10); }

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const W: number[] = [];
    for (let i = 0; i < 16; i++) {
      W[i] = (bytes[offset + i * 4] << 24) | (bytes[offset + i * 4 + 1] << 16) |
              (bytes[offset + i * 4 + 2] << 8) | bytes[offset + i * 4 + 3];
    }
    for (let i = 16; i < 64; i++) {
      W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
    for (let i = 0; i < 64; i++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[i] + W[i]) | 0;
      const T2 = (sigma0(a) + maj(a, b, c)) | 0;
      h = g; g = f; f = e; e = (d + T1) | 0; d = c; c = b; b = a; a = (T1 + T2) | 0;
    }
    H0 = (H0 + a) | 0; H1 = (H1 + b) | 0; H2 = (H2 + c) | 0; H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0; H5 = (H5 + f) | 0; H6 = (H6 + g) | 0; H7 = (H7 + h) | 0;
  }

  return [H0, H1, H2, H3, H4, H5, H6, H7]
    .map(h => (h >>> 0).toString(16).padStart(8, '0')).join('');
}

// ==================== HMAC-SHA256 ====================
function hmacSha256(key: string, message: string): string {
  const blockSize = 64;
  let keyBytes = key;
  if (keyBytes.length > blockSize) keyBytes = sha256(keyBytes);
  while (keyBytes.length < blockSize) keyBytes += '\0';

  let ipad = '', opad = '';
  for (let i = 0; i < blockSize; i++) {
    ipad += String.fromCharCode(keyBytes.charCodeAt(i) ^ 0x36);
    opad += String.fromCharCode(keyBytes.charCodeAt(i) ^ 0x5c);
  }
  const innerHash = sha256(ipad + message);
  // Convert hex back to string for outer hash
  let innerBytes = '';
  for (let i = 0; i < innerHash.length; i += 2) {
    innerBytes += String.fromCharCode(parseInt(innerHash.substr(i, 2), 16));
  }
  return sha256(opad + innerBytes);
}

// ==================== PBKDF2-SHA256 ====================
function pbkdf2(password: string, salt: string, iterations: number, keyLen: number): string {
  let result = '';
  for (let block = 1; result.length < keyLen * 2; block++) {
    let u = hmacSha256(password, salt + String.fromCharCode((block >> 24) & 0xff, (block >> 16) & 0xff, (block >> 8) & 0xff, block & 0xff));
    let t = u;
    for (let i = 1; i < iterations; i++) {
      let uBytes = '';
      for (let j = 0; j < u.length; j += 2) uBytes += String.fromCharCode(parseInt(u.substr(j, 2), 16));
      u = hmacSha256(password, uBytes);
      // XOR t with u
      let newT = '';
      for (let j = 0; j < t.length; j += 2) {
        const tb = parseInt(t.substr(j, 2), 16);
        const ub = parseInt(u.substr(j, 2), 16);
        newT += (tb ^ ub).toString(16).padStart(2, '0');
      }
      t = newT;
    }
    result += t;
  }
  return result.substring(0, keyLen * 2);
}

// ==================== AES-128 (ECB mode, real S-box) ====================
const AES_SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
];

const AES_RCON = [0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];

function aesKeyExpansion(key: number[]): number[][] {
  const Nk = 4, Nr = 10, Nb = 4;
  const W: number[][] = [];
  for (let i = 0; i < Nk; i++) W[i] = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
  for (let i = Nk; i < Nb * (Nr + 1); i++) {
    let temp = [...W[i-1]];
    if (i % Nk === 0) {
      temp = [AES_SBOX[temp[1]], AES_SBOX[temp[2]], AES_SBOX[temp[3]], AES_SBOX[temp[0]]];
      temp[0] ^= AES_RCON[i/Nk - 1];
    }
    W[i] = W[i-Nk].map((b, j) => b ^ temp[j]);
  }
  return W;
}

function gmul(a: number, b: number): number {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

function aesEncryptBlock(block: number[], roundKeys: number[][]): number[] {
  const state = [...block];
  // AddRoundKey
  for (let i = 0; i < 16; i++) state[i] ^= roundKeys[Math.floor(i/4)][i%4];
  for (let round = 1; round <= 10; round++) {
    // SubBytes
    for (let i = 0; i < 16; i++) state[i] = AES_SBOX[state[i]];
    // ShiftRows
    const tmp = [state[1], state[5], state[9], state[13]];
    state[1]=tmp[1]; state[5]=tmp[2]; state[9]=tmp[3]; state[13]=tmp[0];
    const tmp2 = [state[2], state[6], state[10], state[14]];
    state[2]=tmp2[2]; state[6]=tmp2[3]; state[10]=tmp2[0]; state[14]=tmp2[1];
    const tmp3 = [state[3], state[7], state[11], state[15]];
    state[3]=tmp3[3]; state[7]=tmp3[0]; state[11]=tmp3[1]; state[15]=tmp3[2];
    // MixColumns (skip on last round)
    if (round < 10) {
      for (let c = 0; c < 4; c++) {
        const s0 = state[c*4], s1 = state[c*4+1], s2 = state[c*4+2], s3 = state[c*4+3];
        state[c*4]   = gmul(2,s0)^gmul(3,s1)^s2^s3;
        state[c*4+1] = s0^gmul(2,s1)^gmul(3,s2)^s3;
        state[c*4+2] = s0^s1^gmul(2,s2)^gmul(3,s3);
        state[c*4+3] = gmul(3,s0)^s1^s2^gmul(2,s3);
      }
    }
    // AddRoundKey
    for (let i = 0; i < 16; i++) state[i] ^= roundKeys[round*4 + Math.floor(i/4)][i%4];
  }
  return state;
}

// ==================== RSA PRIMITIVES ====================
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

function modInverse(a: bigint, m: bigint): bigint {
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return ((old_s % m) + m) % m;
}

function isProbablyPrime(n: bigint, k: number = 10): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  let d = n - 1n, r = 0;
  while (d % 2n === 0n) { d /= 2n; r++; }
  for (let i = 0; i < k; i++) {
    const a = 2n + BigInt(Math.floor(Math.random() * Number(n - 4n > 1000000n ? 1000000n : n - 4n)));
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let cont = false;
    for (let j = 0; j < r - 1; j++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) { cont = true; break; }
    }
    if (!cont) return false;
  }
  return true;
}

function generatePrime(bits: number): bigint {
  while (true) {
    let n = 1n;
    for (let i = 1; i < bits; i++) n = (n << 1n) | BigInt(Math.random() > 0.5 ? 1 : 0);
    n = n | 1n; // ensure odd
    if (isProbablyPrime(n)) return n;
  }
}

// ==================== DIFFIE-HELLMAN ====================
const DH_P = BigInt('0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF');
const DH_G = 2n;

// ==================== REGISTER ALL CRYPTO FUNCTIONS ====================
export function registerCryptoModule(): void {
  // SHA-256
  lispDefineJs('crypto/sha256', (data: string) => sha256(data));
  lispDefineJs('crypto/sha256-hex', (data: string) => sha256(data));

  // HMAC
  lispDefineJs('crypto/hmac-sha256', (key: string, data: string) => hmacSha256(key, data));

  // PBKDF2
  lispDefineJs('crypto/pbkdf2', (password: string, salt: string, iterations?: number, keyLen?: number) =>
    pbkdf2(password, salt, iterations || 10000, keyLen || 32));

  // bcrypt-like
  lispDefineJs('crypto/bcrypt-hash', (password: string, rounds?: number) => {
    const salt = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    const r = rounds || 12;
    let hash = password + salt;
    for (let i = 0; i < Math.pow(2, r); i++) hash = sha256(hash);
    return `$2b$${r.toString().padStart(2, '0')}$${salt}${hash.substring(0, 40)}`;
  });

  lispDefineJs('crypto/bcrypt-verify', (password: string, hashStr: string) => {
    const parts = hashStr.split('$');
    if (parts.length < 4) return false;
    const rounds = parseInt(parts[2]);
    const salt = parts[3].substring(0, 32);
    let hash = password + salt;
    for (let i = 0; i < Math.pow(2, rounds); i++) hash = sha256(hash);
    return hashStr.endsWith(hash.substring(0, 40));
  });

  // AES-128 ECB
  lispDefineJs('crypto/aes-encrypt', (plaintext: string, keyHex: string) => {
    const key = [];
    for (let i = 0; i < 32; i += 2) key.push(parseInt(keyHex.substr(i, 2), 16) || 0);
    while (key.length < 16) key.push(0);
    const roundKeys = aesKeyExpansion(key.slice(0, 16));

    const bytes: number[] = [];
    for (let i = 0; i < plaintext.length; i++) bytes.push(plaintext.charCodeAt(i));
    // PKCS7 padding
    const padLen = 16 - (bytes.length % 16);
    for (let i = 0; i < padLen; i++) bytes.push(padLen);

    let result = '';
    for (let i = 0; i < bytes.length; i += 16) {
      const block = bytes.slice(i, i + 16);
      const encrypted = aesEncryptBlock(block, roundKeys);
      result += encrypted.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return result;
  });

  // RSA
  lispDefineJs('crypto/rsa-keygen', (bits?: number) => {
    const b = Math.min(bits || 32, 48); // limited for performance in browser
    const p = generatePrime(b);
    const q = generatePrime(b);
    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    const e = 65537n;
    const d = modInverse(e, phi);
    return JSON.stringify({
      public: { n: n.toString(), e: e.toString() },
      private: { n: n.toString(), d: d.toString() },
      p: p.toString(), q: q.toString()
    });
  });

  lispDefineJs('crypto/rsa-encrypt', (message: string, nStr: string, eStr: string) => {
    const n = BigInt(nStr), e = BigInt(eStr);
    const m = BigInt('0x' + Array.from(message).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    return modPow(m, e, n).toString(16);
  });

  lispDefineJs('crypto/rsa-decrypt', (cipherHex: string, nStr: string, dStr: string) => {
    const n = BigInt(nStr), d = BigInt(dStr);
    const c = BigInt('0x' + cipherHex);
    const m = modPow(c, d, n);
    const hex = m.toString(16);
    let result = '';
    for (let i = 0; i < hex.length; i += 2) result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return result;
  });

  // Diffie-Hellman
  lispDefineJs('crypto/dh-keygen', () => {
    let priv = 0n;
    for (let i = 0; i < 64; i++) priv = (priv << 1n) | BigInt(Math.random() > 0.5 ? 1 : 0);
    const pub = modPow(DH_G, priv, DH_P);
    return JSON.stringify({ private: priv.toString(), public: pub.toString(16).substring(0, 64) });
  });

  lispDefineJs('crypto/dh-shared', (myPrivStr: string, theirPubHex: string) => {
    const priv = BigInt(myPrivStr);
    const pub = BigInt('0x' + theirPubHex);
    return modPow(pub, priv, DH_P).toString(16).substring(0, 64);
  });

  // Utility
  lispDefineJs('crypto/random-bytes', (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(''));

  lispDefineJs('crypto/hex-to-bytes', (hex: string) => {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substr(i, 2), 16));
    return bytes.join(',');
  });

  lispDefineJs('crypto/bytes-to-hex', (bytesStr: string) =>
    bytesStr.split(',').map(b => parseInt(b).toString(16).padStart(2, '0')).join(''));

  // MD5 (real implementation)
  lispDefineJs('crypto/md5', (message: string) => {
    function md5cycle(x: number[], k: number[]) {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => { a += ((b & c) | (~b & d)) + x + t; return ((a << s) | (a >>> (32 - s))) + b; };
      const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => { a += ((b & d) | (c & ~d)) + x + t; return ((a << s) | (a >>> (32 - s))) + b; };
      const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => { a += (b ^ c ^ d) + x + t; return ((a << s) | (a >>> (32 - s))) + b; };
      const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) => { a += (c ^ (b | ~d)) + x + t; return ((a << s) | (a >>> (32 - s))) + b; };

      a=ff(a,b,c,d,k[0],7,-680876936); d=ff(d,a,b,c,k[1],12,-389564586); c=ff(c,d,a,b,k[2],17,606105819); b=ff(b,c,d,a,k[3],22,-1044525330);
      a=ff(a,b,c,d,k[4],7,-176418897); d=ff(d,a,b,c,k[5],12,1200080426); c=ff(c,d,a,b,k[6],17,-1473231341); b=ff(b,c,d,a,k[7],22,-45705983);
      a=ff(a,b,c,d,k[8],7,1770035416); d=ff(d,a,b,c,k[9],12,-1958414417); c=ff(c,d,a,b,k[10],17,-42063); b=ff(b,c,d,a,k[11],22,-1990404162);
      a=ff(a,b,c,d,k[12],7,1804603682); d=ff(d,a,b,c,k[13],12,-40341101); c=ff(c,d,a,b,k[14],17,-1502002290); b=ff(b,c,d,a,k[15],22,1236535329);

      a=gg(a,b,c,d,k[1],5,-165796510); d=gg(d,a,b,c,k[6],9,-1069501632); c=gg(c,d,a,b,k[11],14,643717713); b=gg(b,c,d,a,k[0],20,-373897302);
      a=gg(a,b,c,d,k[5],5,-701558691); d=gg(d,a,b,c,k[10],9,38016083); c=gg(c,d,a,b,k[15],14,-660478335); b=gg(b,c,d,a,k[4],20,-405537848);
      a=gg(a,b,c,d,k[9],5,568446438); d=gg(d,a,b,c,k[14],9,-1019803690); c=gg(c,d,a,b,k[3],14,-187363961); b=gg(b,c,d,a,k[8],20,1163531501);
      a=gg(a,b,c,d,k[13],5,-1444681467); d=gg(d,a,b,c,k[2],9,-51403784); c=gg(c,d,a,b,k[7],14,1735328473); b=gg(b,c,d,a,k[12],20,-1926607734);

      a=hh(a,b,c,d,k[5],4,-378558); d=hh(d,a,b,c,k[8],11,-2022574463); c=hh(c,d,a,b,k[11],16,1839030562); b=hh(b,c,d,a,k[14],23,-35309556);
      a=hh(a,b,c,d,k[1],4,-1530992060); d=hh(d,a,b,c,k[4],11,1272893353); c=hh(c,d,a,b,k[7],16,-155497632); b=hh(b,c,d,a,k[10],23,-1094730640);
      a=hh(a,b,c,d,k[13],4,681279174); d=hh(d,a,b,c,k[0],11,-358537222); c=hh(c,d,a,b,k[3],16,-722521979); b=hh(b,c,d,a,k[6],23,76029189);
      a=hh(a,b,c,d,k[9],4,-640364487); d=hh(d,a,b,c,k[12],11,-421815835); c=hh(c,d,a,b,k[15],16,530742520); b=hh(b,c,d,a,k[2],23,-995338651);

      a=ii(a,b,c,d,k[0],6,-198630844); d=ii(d,a,b,c,k[7],10,1126891415); c=ii(c,d,a,b,k[14],15,-1416354905); b=ii(b,c,d,a,k[5],21,-57434055);
      a=ii(a,b,c,d,k[12],6,1700485571); d=ii(d,a,b,c,k[3],10,-1894986606); c=ii(c,d,a,b,k[10],15,-1051523); b=ii(b,c,d,a,k[1],21,-2054922799);
      a=ii(a,b,c,d,k[8],6,1873313359); d=ii(d,a,b,c,k[15],10,-30611744); c=ii(c,d,a,b,k[6],15,-1560198380); b=ii(b,c,d,a,k[13],21,1309151649);
      a=ii(a,b,c,d,k[4],6,-145523070); d=ii(d,a,b,c,k[11],10,-1120210379); c=ii(c,d,a,b,k[2],15,718787259); b=ii(b,c,d,a,k[9],21,-343485551);

      x[0] = (x[0]+a)|0; x[1] = (x[1]+b)|0; x[2] = (x[2]+c)|0; x[3] = (x[3]+d)|0;
    }

    const bytes: number[] = [];
    for (let i = 0; i < message.length; i++) bytes.push(message.charCodeAt(i));
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    bytes.push(bitLen & 0xff, (bitLen >> 8) & 0xff, (bitLen >> 16) & 0xff, (bitLen >> 24) & 0xff, 0, 0, 0, 0);

    const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    for (let i = 0; i < bytes.length; i += 64) {
      const w: number[] = [];
      for (let j = 0; j < 16; j++) w[j] = bytes[i+j*4] | (bytes[i+j*4+1] << 8) | (bytes[i+j*4+2] << 16) | (bytes[i+j*4+3] << 24);
      md5cycle(state, w);
    }

    return state.map(s => {
      const b = [(s) & 0xff, (s >> 8) & 0xff, (s >> 16) & 0xff, (s >> 24) & 0xff];
      return b.map(x => x.toString(16).padStart(2, '0')).join('');
    }).join('');
  });
}
