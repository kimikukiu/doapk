import React, { useState } from 'react';
import { lispRepl } from '../../src/services/lispApi';

const LispClispPanel: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [filePath, setFilePath] = useState('');
  const [fileCode, setFileCode] = useState('');
  const [memName, setMemName] = useState('');

  const run = (code: string, label: string) => {
    const r = lispRepl(code);
    setOutput(prev => [...prev, `[${label}] ${code}`, r.output]);
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-orange-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-orange-500/20 rounded flex items-center justify-center">
            <i className="fas fa-file-code text-orange-400 text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">GNU <span className="text-orange-400">CLISP Exploitation</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">.lisp · .lsp · .cl · .fas · .mem — Bytecode Compiler · Decompiler · Memory Dump · Registry Hijack</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create / Compile */}
        <div className="bg-black border border-orange-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-orange-400 uppercase mb-2"><i className="fas fa-file-pen mr-1"></i> Create & Compile LISP Files</h3>
          <div className="space-y-1 mb-2">
            <input value={filePath} onChange={e => setFilePath(e.target.value)} placeholder="File path: main.lisp"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-orange-300 font-mono outline-none" />
            <textarea value={fileCode} onChange={e => setFileCode(e.target.value)}
              placeholder='(defun hello () (format t "Hello World"))&#10;(defvar *counter* 0)&#10;(defclass user () ((name :initarg :name)))'
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-orange-300 font-mono outline-none h-20 resize-none" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => run(`(clisp/create-lisp "${filePath}" "${fileCode.replace(/"/g, '\\"')}")`, 'CREATE')} className="px-2 py-1 bg-orange-600 text-black font-black text-[7px] uppercase rounded">.lisp</button>
            <button onClick={() => run(`(clisp/create-lsp "${filePath.replace('.lisp', '.lsp')}" "${fileCode.replace(/"/g, '\\"')}")`, 'CREATE')} className="px-2 py-1 bg-orange-700 text-white font-black text-[7px] uppercase rounded">.lsp</button>
            <button onClick={() => run(`(clisp/create-cl "${filePath.replace('.lisp', '.cl')}" "${fileCode.replace(/"/g, '\\"')}")`, 'CREATE')} className="px-2 py-1 bg-orange-800 text-white font-black text-[7px] uppercase rounded">.cl</button>
            <button onClick={() => run(`(clisp/compile-fas "${filePath}")`, 'COMPILE')} className="px-2 py-1 bg-yellow-600 text-black font-black text-[7px] uppercase rounded">Compile .fas</button>
          </div>
        </div>

        {/* Memory Images */}
        <div className="bg-black border border-orange-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-orange-400 uppercase mb-2"><i className="fas fa-memory mr-1"></i> Memory Images (.mem)</h3>
          <div className="space-y-1 mb-2">
            <input value={memName} onChange={e => setMemName(e.target.value)} placeholder="Image name: my-image"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-orange-300 font-mono outline-none" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => run(`(clisp/save-mem "${memName}")`, 'SAVE')} className="px-2 py-1 bg-orange-600 text-black font-black text-[7px] uppercase rounded">Save .mem</button>
            <button onClick={() => run(`(clisp/load-mem "${memName}")`, 'LOAD')} className="px-2 py-1 bg-orange-700 text-white font-black text-[7px] uppercase rounded">Load .mem</button>
            <button onClick={() => run(`(clisp/dump-memory "${memName}")`, 'DUMP')} className="px-2 py-1 bg-red-600 text-black font-black text-[7px] uppercase rounded">Dump Memory</button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => run('(clisp/list-files)', 'FILES')} className="p-2 bg-black border border-orange-900/20 rounded hover:border-orange-500/30 transition-all">
          <span className="text-[8px] font-black text-orange-400 uppercase block">List Files</span>
          <span className="text-[6px] text-gray-600">All .lisp/.lsp/.cl/.fas/.mem</span>
        </button>
        <button onClick={() => run(`(clisp/decompile-fas "${filePath.replace(/\.(lisp|lsp|cl)$/, '.fas')}")`, 'DECOMPILE')} className="p-2 bg-black border border-orange-900/20 rounded hover:border-orange-500/30 transition-all">
          <span className="text-[8px] font-black text-orange-400 uppercase block">Decompile .fas</span>
          <span className="text-[6px] text-gray-600">Reverse bytecode to source</span>
        </button>
        <button onClick={() => run(`(clisp/read-file "${filePath}")`, 'READ')} className="p-2 bg-black border border-orange-900/20 rounded hover:border-orange-500/30 transition-all">
          <span className="text-[8px] font-black text-orange-400 uppercase block">Read File</span>
          <span className="text-[6px] text-gray-600">View file contents</span>
        </button>
        <button onClick={() => run('(clisp/registry-exploit)', 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Registry Exploit</span>
          <span className="text-[6px] text-gray-600">HKEY_CLASSES_ROOT hijack</span>
        </button>
      </div>

      {/* Output */}
      <div className="bg-black border border-orange-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-orange-900/10 bg-orange-900/5 flex items-center justify-between">
          <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> CLISP Output</span>
          <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-orange-400 transition-all">Clear</button>
        </div>
        <div className="p-3 h-48 overflow-y-auto custom-scroll font-mono text-[8px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Create, compile, or exploit CLISP files above...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('[') ? 'text-orange-400' : line.includes('ERROR') ? 'text-red-400' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LispClispPanel;
