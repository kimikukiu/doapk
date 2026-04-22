import React, { useState } from 'react';
import { lispRepl } from '../../src/services/lispApi';

const LispCryptoPanel: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [hashInput, setHashInput] = useState('');
  const [bcryptInput, setBcryptInput] = useState('');
  const [aesInput, setAesInput] = useState('');
  const [aesKey, setAesKey] = useState('');
  const [hmacInput, setHmacInput] = useState('');
  const [hmacKey, setHmacKey] = useState('');

  const run = (code: string, label: string) => {
    const r = lispRepl(code);
    setOutput(prev => [...prev, `[${label}] ${code}`, r.output]);
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-amber-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-amber-500/20 rounded flex items-center justify-center">
            <i className="fas fa-lock text-amber-400 text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">LISP <span className="text-amber-400">Crypto Engine</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">Real SHA-256 · HMAC · PBKDF2 · AES-128 · RSA · Diffie-Hellman · MD5 · Bcrypt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SHA-256 + MD5 */}
        <div className="bg-black border border-amber-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-amber-400 uppercase mb-2"><i className="fas fa-hashtag mr-1"></i> SHA-256 / MD5 Hash</h3>
          <div className="flex gap-2 mb-2">
            <input value={hashInput} onChange={e => setHashInput(e.target.value)} placeholder="Data to hash..."
              className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-amber-300 font-mono outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => run(`(crypto/sha256 "${hashInput}")`, 'SHA-256')} className="px-3 py-1 bg-amber-600 text-black font-black text-[7px] uppercase rounded">SHA-256</button>
            <button onClick={() => run(`(crypto/md5 "${hashInput}")`, 'MD5')} className="px-3 py-1 bg-amber-700 text-black font-black text-[7px] uppercase rounded">MD5</button>
            <button onClick={() => run(`(hash-compare "${hashInput}")`, 'BOTH')} className="px-3 py-1 bg-amber-500 text-black font-black text-[7px] uppercase rounded">Both</button>
          </div>
        </div>

        {/* Bcrypt */}
        <div className="bg-black border border-amber-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-amber-400 uppercase mb-2"><i className="fas fa-shield-halved mr-1"></i> Bcrypt Password Hash</h3>
          <div className="flex gap-2 mb-2">
            <input value={bcryptInput} onChange={e => setBcryptInput(e.target.value)} placeholder="Password..."
              className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-amber-300 font-mono outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => run(`(crypto/bcrypt-hash "${bcryptInput}" 10)`, 'BCRYPT')} className="px-3 py-1 bg-amber-600 text-black font-black text-[7px] uppercase rounded">Hash (10 rounds)</button>
            <button onClick={() => run(`(secure-password "${bcryptInput}")`, 'BCRYPT-12')} className="px-3 py-1 bg-amber-500 text-black font-black text-[7px] uppercase rounded">Secure (12)</button>
          </div>
        </div>

        {/* AES-128 */}
        <div className="bg-black border border-amber-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-amber-400 uppercase mb-2"><i className="fas fa-key mr-1"></i> AES-128 Encrypt</h3>
          <div className="space-y-1 mb-2">
            <input value={aesInput} onChange={e => setAesInput(e.target.value)} placeholder="Plaintext..."
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-amber-300 font-mono outline-none" />
            <input value={aesKey} onChange={e => setAesKey(e.target.value)} placeholder="16-char key (e.g. mysecretkey12345)"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-amber-300 font-mono outline-none" />
          </div>
          <button onClick={() => run(`(crypto/aes-encrypt "${aesInput}" "${aesKey}")`, 'AES')} className="px-3 py-1 bg-amber-600 text-black font-black text-[7px] uppercase rounded">Encrypt</button>
        </div>

        {/* HMAC-SHA256 */}
        <div className="bg-black border border-amber-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-amber-400 uppercase mb-2"><i className="fas fa-fingerprint mr-1"></i> HMAC-SHA256</h3>
          <div className="space-y-1 mb-2">
            <input value={hmacInput} onChange={e => setHmacInput(e.target.value)} placeholder="Message..."
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-amber-300 font-mono outline-none" />
            <input value={hmacKey} onChange={e => setHmacKey(e.target.value)} placeholder="HMAC key..."
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-amber-300 font-mono outline-none" />
          </div>
          <button onClick={() => run(`(crypto/hmac-sha256 "${hmacInput}" "${hmacKey}")`, 'HMAC')} className="px-3 py-1 bg-amber-600 text-black font-black text-[7px] uppercase rounded">Compute HMAC</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => run('(crypto/rsa-keygen 32)', 'RSA')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">RSA Keygen</span>
          <span className="text-[6px] text-gray-600">Generate RSA keypair</span>
        </button>
        <button onClick={() => run('(rsa-demo "test-message")', 'RSA-DEMO')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">RSA Full Demo</span>
          <span className="text-[6px] text-gray-600">Keygen+Encrypt+Decrypt</span>
        </button>
        <button onClick={() => run('(crypto/dh-keygen)', 'DH')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">Diffie-Hellman</span>
          <span className="text-[6px] text-gray-600">Generate DH keypair</span>
        </button>
        <button onClick={() => run('(crypto/pbkdf2 "password" "salt" 10000 32)', 'PBKDF2')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">PBKDF2</span>
          <span className="text-[6px] text-gray-600">Key derivation 10K iters</span>
        </button>
        <button onClick={() => run('(crypto/random-bytes 32)', 'RAND')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">Random Bytes</span>
          <span className="text-[6px] text-gray-600">32 random bytes hex</span>
        </button>
        <button onClick={() => run('(crypto/random-bytes 64)', 'RAND')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">Random 64B</span>
          <span className="text-[6px] text-gray-600">64 random bytes hex</span>
        </button>
        <button onClick={() => run('(sec/gen-password 32)', 'PASSGEN')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">Gen Password</span>
          <span className="text-[6px] text-gray-600">32-char secure password</span>
        </button>
        <button onClick={() => run('(sec/gen-uuid)', 'UUID')} className="p-2 bg-black border border-amber-900/20 rounded hover:border-amber-500/30 transition-all">
          <span className="text-[8px] font-black text-amber-400 uppercase block">Gen UUID</span>
          <span className="text-[6px] text-gray-600">Random UUID v4</span>
        </button>
      </div>

      {/* Output */}
      <div className="bg-black border border-amber-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-amber-900/10 bg-amber-900/5 flex items-center justify-between">
          <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> Output</span>
          <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-amber-400 transition-all">Clear</button>
        </div>
        <div className="p-3 h-48 overflow-y-auto custom-scroll font-mono text-[8px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Click any button above to run crypto operations...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('[') ? 'text-amber-400' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LispCryptoPanel;
