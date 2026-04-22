import React, { useState } from 'react';
import { lispRepl, lispApiEval, lispAiGenerate } from '../../src/services/lispApi';

const LispAiControl: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const runCode = () => {
    if (!input.trim()) return;
    const result = lispRepl(input);
    setOutput(prev => [...prev, `> ${input}`, result.output]);
    setInput('');
  };

  const runAiGen = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setOutput(prev => [...prev, `[AI] Generating: ${aiPrompt}...`]);
    try {
      const res = await lispAiGenerate(aiPrompt);
      setOutput(prev => [...prev, `[AI-CODE]\n${res.lispCode}`, `[AI-RESULT] ${res.result?.output?.join('\n') || 'OK'}`]);
    } catch (e: any) {
      setOutput(prev => [...prev, `[AI-ERROR] ${e.message}`]);
    }
    setIsGenerating(false);
    setAiPrompt('');
  };

  const presets = [
    { label: 'Scan GPT DNA', code: '(scan-ai-dna "gpt")' },
    { label: 'Scan DeepSeek', code: '(scan-ai-dna "deepseek")' },
    { label: 'Hash Test', code: '(hash-compare "whoamisec")' },
    { label: 'Setup DB', code: '(setup-users-db)' },
    { label: 'Train XOR NN', code: '(train-xor-network)' },
    { label: 'Security Audit', code: '(security-audit "target.com")' },
    { label: 'Genesis Crack', code: '(genesis-crack "gpt")' },
    { label: 'Cisco Takeover', code: '(cisco-takeover "corp.local")' },
    { label: 'Gen Webapp', code: '(gen-webapp "myapp")' },
    { label: 'Stats Pipeline', code: '(analyze-data "10,20,30,40,50,60,70,80,90,100")' },
    { label: 'RSA Demo', code: '(rsa-demo "hello-world")' },
    { label: 'All AI Systems', code: '(break/dna-all)' },
  ];

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-green-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
            <i className="fas fa-terminal text-green-400 text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">LISP AI <span className="text-green-400">Control Engine</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">Genesis Crack LISP Interpreter — 350+ Functions — Real-Time Execution</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {presets.map((p, i) => (
          <button key={i} onClick={() => { setInput(p.code); const r = lispRepl(p.code); setOutput(prev => [...prev, `> ${p.code}`, r.output]); }}
            className="p-2 bg-black border border-green-900/20 rounded hover:border-green-500/40 transition-all text-left group">
            <span className="text-[8px] font-black text-green-400 uppercase block">{p.label}</span>
            <span className="text-[6px] text-gray-600 font-mono truncate block">{p.code}</span>
          </button>
        ))}
      </div>

      <div className="bg-black border border-green-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-green-900/10 bg-green-900/5 flex items-center gap-2">
          <i className="fas fa-code text-green-500 text-[8px]"></i>
          <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">LISP REPL</span>
        </div>
        <div className="p-3 h-64 overflow-y-auto custom-scroll font-mono text-[9px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Type LISP code or click a preset above...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('>') ? 'text-green-400' : line.startsWith('[AI') ? 'text-cyan-400' : line.includes('ERROR') ? 'text-red-400' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
        <div className="p-2 border-t border-green-900/10 flex gap-2">
          <span className="text-green-500 font-mono text-[10px] py-1">λ&gt;</span>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && runCode()}
            placeholder="(println &quot;Hello LISP&quot;)" className="flex-1 bg-transparent text-green-300 font-mono text-[10px] outline-none" />
          <button onClick={runCode} className="px-3 py-1 bg-green-600 text-black font-black text-[8px] uppercase rounded hover:bg-green-500 transition-all">Eval</button>
        </div>
      </div>

      <div className="bg-black border border-cyan-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-cyan-900/10 bg-cyan-900/5 flex items-center gap-2">
          <i className="fas fa-brain text-cyan-500 text-[8px]"></i>
          <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">AI LISP Generator</span>
        </div>
        <div className="p-2 flex gap-2">
          <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && runAiGen()}
            placeholder="Describe what you want in natural language..." className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-cyan-300 text-[10px] outline-none" />
          <button onClick={runAiGen} disabled={isGenerating}
            className="px-4 py-2 bg-cyan-600 text-black font-black text-[8px] uppercase rounded hover:bg-cyan-500 transition-all disabled:opacity-50">
            {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LispAiControl;
