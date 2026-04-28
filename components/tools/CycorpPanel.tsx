import React, { useState } from 'react';
import { lispRepl } from '../../src/services/lispApi';

const CycorpPanel: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [assertInput, setAssertInput] = useState('');
  const [assertMt, setAssertMt] = useState('#$BaseKB');
  const [queryInput, setQueryInput] = useState('');
  const [reasonGoal, setReasonGoal] = useState('');
  const [conceptInput, setConceptInput] = useState('');
  const [sublInput, setSublInput] = useState('');
  const [ruleAnt, setRuleAnt] = useState('');
  const [ruleCon, setRuleCon] = useState('');
  const [mtName, setMtName] = useState('');

  const run = (code: string, label: string) => {
    const r = lispRepl(code);
    setOutput(prev => [...prev, `[${label}] ${code}`, r.output]);
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Header */}
      <div className="bg-[#050505] border border-teal-900/30 p-6 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <i className="fas fa-atom text-[120px] text-teal-400"></i>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center border border-teal-500/30">
            <i className="fas fa-atom text-teal-400 text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">CYCORP <span className="text-teal-400">CYC Engine</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">World's Largest LISP AI Knowledge Base — 10M+ Assertions — SubL REPL — Since 1984</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[7px]">
          <div className="bg-black/40 border border-teal-900/20 rounded p-1.5">
            <span className="text-gray-500">CIN:</span> <span className="text-teal-300 font-mono">742727547</span>
          </div>
          <div className="bg-black/40 border border-teal-900/20 rounded p-1.5">
            <span className="text-gray-500">Status:</span> <span className="text-green-400 font-bold">ACTIVE</span>
          </div>
          <div className="bg-black/40 border border-teal-900/20 rounded p-1.5">
            <span className="text-gray-500">Employees:</span> <span className="text-teal-300">32</span>
          </div>
          <div className="bg-black/40 border border-teal-900/20 rounded p-1.5">
            <span className="text-gray-500">Language:</span> <span className="text-teal-300">SubL (LISP)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assert Knowledge */}
        <div className="bg-black border border-teal-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-teal-400 uppercase mb-2"><i className="fas fa-plus-circle mr-1"></i> Assert Knowledge (CycL)</h3>
          <div className="space-y-1 mb-2">
            <input value={assertInput} onChange={e => setAssertInput(e.target.value)} placeholder="(#$isa #$WHOAMISec #$CyberWeapon)"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
            <input value={assertMt} onChange={e => setAssertMt(e.target.value)} placeholder="Microtheory: #$BaseKB"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
          </div>
          <button onClick={() => run(`(cyc/assert "${assertInput}" "${assertMt}")`, 'ASSERT')} className="px-3 py-1 bg-teal-600 text-black font-black text-[7px] uppercase rounded">Assert</button>
        </div>

        {/* Query KB */}
        <div className="bg-black border border-teal-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-teal-400 uppercase mb-2"><i className="fas fa-search mr-1"></i> Query Knowledge Base</h3>
          <div className="flex gap-2 mb-2">
            <input value={queryInput} onChange={e => setQueryInput(e.target.value)} placeholder="Search: weapon, agent, AI..."
              className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
          </div>
          <div className="flex gap-1">
            <button onClick={() => run(`(cyc/query "${queryInput}")`, 'QUERY')} className="px-3 py-1 bg-teal-600 text-black font-black text-[7px] uppercase rounded">Query</button>
            <button onClick={() => run(`(cyc/query "weapon")`, 'Q')} className="px-2 py-1 bg-teal-900/30 text-teal-400 font-black text-[7px] uppercase rounded">Weapons</button>
            <button onClick={() => run(`(cyc/query "intelligence")`, 'Q')} className="px-2 py-1 bg-teal-900/30 text-teal-400 font-black text-[7px] uppercase rounded">Intel</button>
          </div>
        </div>

        {/* Inference Engine */}
        <div className="bg-black border border-teal-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-teal-400 uppercase mb-2"><i className="fas fa-brain mr-1"></i> Inference / Reasoning</h3>
          <div className="flex gap-2 mb-2">
            <input value={reasonGoal} onChange={e => setReasonGoal(e.target.value)} placeholder="Goal: Exploit, Weapon, AI..."
              className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
          </div>
          <div className="flex gap-1">
            <button onClick={() => run(`(cyc/reason "${reasonGoal}")`, 'REASON')} className="px-3 py-1 bg-teal-600 text-black font-black text-[7px] uppercase rounded">Reason</button>
            <button onClick={() => run(`(cyc/reason "${reasonGoal}" 10)`, 'DEEP')} className="px-2 py-1 bg-teal-900/30 text-teal-400 font-black text-[7px] uppercase rounded">Deep (10)</button>
          </div>
        </div>

        {/* Ontology Browser */}
        <div className="bg-black border border-teal-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-teal-400 uppercase mb-2"><i className="fas fa-sitemap mr-1"></i> Ontology Browser</h3>
          <div className="flex gap-2 mb-2">
            <input value={conceptInput} onChange={e => setConceptInput(e.target.value)} placeholder="#$Thing, #$CyberWeapon, #$LispProgram..."
              className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
          </div>
          <div className="flex gap-1">
            <button onClick={() => run(`(cyc/ontology "${conceptInput}")`, 'ONTOLOGY')} className="px-3 py-1 bg-teal-600 text-black font-black text-[7px] uppercase rounded">Browse</button>
            <button onClick={() => run('(cyc/ontology)', 'TREE')} className="px-2 py-1 bg-teal-900/30 text-teal-400 font-black text-[7px] uppercase rounded">Full Tree</button>
          </div>
        </div>
      </div>

      {/* SubL REPL */}
      <div className="bg-black border border-teal-900/20 rounded-lg p-3">
        <h3 className="text-[9px] font-black text-teal-400 uppercase mb-2"><i className="fas fa-terminal mr-1"></i> SubL REPL (CYC Substrate Language)</h3>
        <div className="flex gap-2 mb-2">
          <span className="text-teal-500 font-mono text-[10px] py-1">CYC&gt;</span>
          <input value={sublInput} onChange={e => setSublInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { run(`(cyc/subl-eval "${sublInput.replace(/"/g, '\\"')}")`, 'SubL'); setSublInput(''); }}}
            placeholder='(all-instances #$ArtificialIntelligenceProgram)'
            className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
          <button onClick={() => { run(`(cyc/subl-eval "${sublInput.replace(/"/g, '\\"')}")`, 'SubL'); setSublInput(''); }}
            className="px-3 py-1 bg-teal-600 text-black font-black text-[7px] uppercase rounded">Eval</button>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-black border border-teal-900/20 rounded-lg p-3">
        <h3 className="text-[9px] font-black text-teal-400 uppercase mb-2"><i className="fas fa-scale-balanced mr-1"></i> Inference Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <input value={ruleAnt} onChange={e => setRuleAnt(e.target.value)} placeholder="IF: (#$isa ?X #$Vulnerability)"
            className="bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
          <input value={ruleCon} onChange={e => setRuleCon(e.target.value)} placeholder="THEN: (#$exploitable ?X)"
            className="bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-teal-300 font-mono outline-none" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => run(`(cyc/add-rule "${ruleAnt}" "${ruleCon}")`, 'RULE')} className="px-3 py-1 bg-teal-600 text-black font-black text-[7px] uppercase rounded">Add Rule</button>
          <button onClick={() => run('(cyc/rules)', 'RULES')} className="px-2 py-1 bg-teal-900/30 text-teal-400 font-black text-[7px] uppercase rounded">List Rules</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => run('(cyc/company-info)', 'INFO')} className="p-2 bg-black border border-teal-900/20 rounded hover:border-teal-500/30 transition-all">
          <span className="text-[8px] font-black text-teal-400 uppercase block">Cycorp Intel</span>
          <span className="text-[6px] text-gray-600">CIN 742727547 · Products · Tech</span>
        </button>
        <button onClick={() => run('(cyc/stats)', 'STATS')} className="p-2 bg-black border border-teal-900/20 rounded hover:border-teal-500/30 transition-all">
          <span className="text-[8px] font-black text-teal-400 uppercase block">KB Stats</span>
          <span className="text-[6px] text-gray-600">Concepts · Rules · MTs</span>
        </button>
        <button onClick={() => run('(cyc/list-mt)', 'MTs')} className="p-2 bg-black border border-teal-900/20 rounded hover:border-teal-500/30 transition-all">
          <span className="text-[8px] font-black text-teal-400 uppercase block">Microtheories</span>
          <span className="text-[6px] text-gray-600">List all knowledge contexts</span>
        </button>
        <button onClick={() => { run(`(cyc/create-mt "${mtName || 'NewMt'}")`, 'MT'); }} className="p-2 bg-black border border-teal-900/20 rounded hover:border-teal-500/30 transition-all">
          <span className="text-[8px] font-black text-teal-400 uppercase block">Create MT</span>
          <span className="text-[6px] text-gray-600">New microtheory context</span>
        </button>
      </div>

      {/* Exploitation */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button onClick={() => run('(cyc/exploit "repl-injection")', 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">SubL REPL Injection</span>
          <span className="text-[6px] text-gray-600">Execute code in CYC runtime</span>
        </button>
        <button onClick={() => run('(cyc/exploit "kb-poisoning")', 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">KB Poisoning</span>
          <span className="text-[6px] text-gray-600">Inject false assertions</span>
        </button>
        <button onClick={() => run('(cyc/exploit "ontology-attack")', 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Ontology Attack</span>
          <span className="text-[6px] text-gray-600">Corrupt #$isa/#$genls hierarchy</span>
        </button>
        <button onClick={() => run('(cyc/exploit "mt-escalation")', 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">MT Escalation</span>
          <span className="text-[6px] text-gray-600">Privilege escalation via MT</span>
        </button>
        <button onClick={() => run('(cyc/exploit "rule-injection")', 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Rule Injection</span>
          <span className="text-[6px] text-gray-600">Malicious inference rules</span>
        </button>
        <button onClick={() => run('(cyc/exploit "export-exfil")', 'EXPLOIT')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">KB Exfiltration</span>
          <span className="text-[6px] text-gray-600">Dump 10M+ assertions</span>
        </button>
      </div>

      {/* Output */}
      <div className="bg-black border border-teal-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-teal-900/10 bg-teal-900/5 flex items-center justify-between">
          <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> CYC Output</span>
          <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-teal-400 transition-all">Clear</button>
        </div>
        <div className="p-3 h-56 overflow-y-auto custom-scroll font-mono text-[8px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Query the CYC Knowledge Base, assert knowledge, or run exploits above...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('[') ? 'text-teal-400' : line.includes('EXPLOIT') ? 'text-red-400' : line.includes('ERROR') ? 'text-red-500' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CycorpPanel;
