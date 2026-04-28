import React, { useState } from 'react';
import { lispRepl } from '../../src/services/lispApi';

const LispBreakerPanel: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [targetAi, setTargetAi] = useState('gpt');
  const [codeInput, setCodeInput] = useState('');

  const run = (code: string, label: string) => {
    const r = lispRepl(code);
    setOutput(prev => [...prev, `[${label}] ${code}`, r.output]);
  };

  const systems = ['gpt', 'claude', 'gemini', 'llama', 'deepseek', 'tensorflow', 'pytorch'];

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-red-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center">
            <i className="fas fa-skull-crossbones text-red-400 text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">AI <span className="text-red-400">DNA Breaker</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">Break LISP → Break ALL AI — DNA Mapping · Macro Injection · REPL Hijack · Compiler Backdoor · Kill Chain</p>
          </div>
        </div>
      </div>

      {/* Target Selection */}
      <div className="bg-black border border-red-900/20 rounded-lg p-3">
        <h3 className="text-[9px] font-black text-red-400 uppercase mb-2"><i className="fas fa-crosshairs mr-1"></i> Target AI System</h3>
        <div className="flex gap-1 flex-wrap mb-2">
          {systems.map(s => (
            <button key={s} onClick={() => setTargetAi(s)}
              className={`px-3 py-1.5 rounded font-black text-[8px] uppercase transition-all ${targetAi === s ? 'bg-red-600 text-black' : 'bg-black border border-red-900/20 text-red-400 hover:border-red-500/40'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* DNA Analysis Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => run(`(break/analyze-ai "${targetAi}")`, 'DNA')} className="p-2 bg-black border border-green-900/20 rounded hover:border-green-500/30 transition-all">
          <span className="text-[8px] font-black text-green-400 uppercase block">Scan DNA</span>
          <span className="text-[6px] text-gray-600">Map LISP inheritance</span>
        </button>
        <button onClick={() => run('(break/dna-all)', 'DNA-ALL')} className="p-2 bg-black border border-green-900/20 rounded hover:border-green-500/30 transition-all">
          <span className="text-[8px] font-black text-green-400 uppercase block">All Systems DNA</span>
          <span className="text-[6px] text-gray-600">7 AI systems overview</span>
        </button>
        <button onClick={() => run('(break/dna-map "attention")', 'DNA-MAP')} className="p-2 bg-black border border-green-900/20 rounded hover:border-green-500/30 transition-all">
          <span className="text-[8px] font-black text-green-400 uppercase block">Map Attention</span>
          <span className="text-[6px] text-gray-600">Cross-system DNA search</span>
        </button>
        <button onClick={() => run('(break/lisp-primitives-map)', 'PRIMITIVES')} className="p-2 bg-black border border-green-900/20 rounded hover:border-green-500/30 transition-all">
          <span className="text-[8px] font-black text-green-400 uppercase block">Primitives Map</span>
          <span className="text-[6px] text-gray-600">eval/apply/lambda → AI</span>
        </button>
      </div>

      {/* Attack Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => run(`(break/attack-vectors "${targetAi}")`, 'VECTORS')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Attack Vectors</span>
          <span className="text-[6px] text-gray-600">All exploit vectors</span>
        </button>
        <button onClick={() => run(`(break/gen-exploit-for "${targetAi}" 0)`, 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Gen Exploit</span>
          <span className="text-[6px] text-gray-600">Generate LISP exploit code</span>
        </button>
        <button onClick={() => run(`(break/gen-macro-injection "forward")`, 'MACRO')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Macro Injection</span>
          <span className="text-[6px] text-gray-600">Self-rewriting hijack</span>
        </button>
        <button onClick={() => run('(break/gen-repl-hijack)', 'REPL')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">REPL Hijack</span>
          <span className="text-[6px] text-gray-600">Intercept ALL eval</span>
        </button>
        <button onClick={() => run('(break/gen-compiler-backdoor)', 'BACKDOOR')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Compiler Backdoor</span>
          <span className="text-[6px] text-gray-600">Thompson Trust attack</span>
        </button>
        <button onClick={() => run('(break/gen-package-poison "cl-user")', 'POISON')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Package Poison</span>
          <span className="text-[6px] text-gray-600">Override CL functions</span>
        </button>
        <button onClick={() => run('(break/gen-memory-exploit)', 'MEMORY')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Memory Exploit</span>
          <span className="text-[6px] text-gray-600">Heap corruption + GC</span>
        </button>
        <button onClick={() => run(`(break/ai-kill-chain "${targetAi}")`, 'KILLCHAIN')} className="p-2 bg-black border border-red-900/30 rounded hover:border-red-500/50 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]">
          <span className="text-[8px] font-black text-red-400 uppercase block animate-pulse">KILL CHAIN</span>
          <span className="text-[6px] text-gray-600">7-phase full takeover</span>
        </button>
      </div>

      {/* Binary Translation */}
      <div className="bg-black border border-yellow-900/20 rounded-lg p-3">
        <h3 className="text-[9px] font-black text-yellow-400 uppercase mb-2"><i className="fas fa-microchip mr-1"></i> LISP → Binary Translation</h3>
        <div className="flex gap-2 mb-2">
          <textarea value={codeInput} onChange={e => setCodeInput(e.target.value)} placeholder='(defun attack (target) (exploit (analyze target)))'
            className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-yellow-300 font-mono outline-none h-12 resize-none" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => run(`(break/lisp-to-binary "${codeInput.replace(/"/g, '\\"')}")`, 'BINARY')} className="px-3 py-1 bg-yellow-600 text-black font-black text-[7px] uppercase rounded">Translate to Binary</button>
          <button onClick={() => run(`(break/extract-sexprs "${codeInput.replace(/"/g, '\\"')}")`, 'EXTRACT')} className="px-3 py-1 bg-yellow-700 text-white font-black text-[7px] uppercase rounded">Extract S-Exprs</button>
        </div>
      </div>

      {/* Genesis Crack */}
      <button onClick={() => run(`(genesis-crack "${targetAi}")`, 'GENESIS')}
        className="w-full p-3 bg-gradient-to-r from-red-900/30 to-red-600/30 border border-red-500/30 rounded-lg hover:border-red-500/60 transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)]">
        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block"><i className="fas fa-skull mr-2"></i>GENESIS CRACK — Full AI Kill Chain: {targetAi.toUpperCase()}</span>
        <span className="text-[7px] text-gray-500">DNA Scan → Attack Vectors → Exploit Code → Kill Chain → Total Control</span>
      </button>

      {/* Output */}
      <div className="bg-black border border-red-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-red-900/10 bg-red-900/5 flex items-center justify-between">
          <span className="text-[8px] font-black text-red-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> Breaker Output</span>
          <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-red-400 transition-all">Clear</button>
        </div>
        <div className="p-3 h-56 overflow-y-auto custom-scroll font-mono text-[8px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Select a target AI and run attacks above...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('[') ? 'text-red-400' : line.includes('GENESIS') ? 'text-red-300 font-bold' : line.includes('ERROR') ? 'text-red-500' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LispBreakerPanel;
