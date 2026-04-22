import React, { useState } from 'react';
import { lispRepl } from '../../src/services/lispApi';

const LispCiscoPanel: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [eid, setEid] = useState('');
  const [rloc, setRloc] = useState('');
  const [subnet, setSubnet] = useState('192.168.1.0');
  const [fabricDomain, setFabricDomain] = useState('corp.local');

  const run = (code: string, label: string) => {
    const r = lispRepl(code);
    setOutput(prev => [...prev, `[${label}] ${code}`, r.output]);
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-cyan-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-cyan-500/20 rounded flex items-center justify-center">
            <i className="fas fa-network-wired text-cyan-400 text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">Cisco <span className="text-cyan-400">LISP Protocol</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">RFC 6830/9300/9301 — EID/RLOC Mapping · Map Poisoning · SD-Access Takeover · Tunnel MITM</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Map Register */}
        <div className="bg-black border border-cyan-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-cyan-400 uppercase mb-2"><i className="fas fa-map-pin mr-1"></i> Map Register (EID → RLOC)</h3>
          <div className="space-y-1 mb-2">
            <input value={eid} onChange={e => setEid(e.target.value)} placeholder="EID prefix: 10.0.0.0/8"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-cyan-300 font-mono outline-none" />
            <input value={rloc} onChange={e => setRloc(e.target.value)} placeholder="RLOC: 172.16.0.1"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-cyan-300 font-mono outline-none" />
          </div>
          <div className="flex gap-1">
            <button onClick={() => run(`(cisco/map-register "${eid}" "${rloc}")`, 'REGISTER')} className="px-2 py-1 bg-cyan-600 text-black font-black text-[7px] uppercase rounded">Register</button>
            <button onClick={() => run(`(cisco/map-request "${eid}")`, 'REQUEST')} className="px-2 py-1 bg-cyan-700 text-white font-black text-[7px] uppercase rounded">Request</button>
            <button onClick={() => run('(cisco/map-cache)', 'CACHE')} className="px-2 py-1 bg-cyan-800 text-white font-black text-[7px] uppercase rounded">View Cache</button>
          </div>
        </div>

        {/* Exploitation */}
        <div className="bg-black border border-red-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-red-400 uppercase mb-2"><i className="fas fa-crosshairs mr-1"></i> LISP Protocol Exploitation</h3>
          <div className="space-y-1 mb-2">
            <input value={fabricDomain} onChange={e => setFabricDomain(e.target.value)} placeholder="Fabric domain: corp.local"
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-red-300 font-mono outline-none" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => run(`(cisco/poison-map "${eid}" "6.6.6.6")`, 'POISON')} className="px-2 py-1 bg-red-600 text-black font-black text-[7px] uppercase rounded">Poison Map</button>
            <button onClick={() => run(`(cisco/hijack-eid "${eid}" "6.6.6.6")`, 'HIJACK')} className="px-2 py-1 bg-red-700 text-white font-black text-[7px] uppercase rounded">Hijack EID</button>
            <button onClick={() => run(`(cisco/mitm-tunnel "${eid}" "6.6.6.6" "${rloc}")`, 'MITM')} className="px-2 py-1 bg-red-800 text-white font-black text-[7px] uppercase rounded">MITM Tunnel</button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => run(`(cisco/sd-access-exploit "${fabricDomain}")`, 'SD-ACCESS')} className="p-2 bg-black border border-cyan-900/20 rounded hover:border-cyan-500/30 transition-all">
          <span className="text-[8px] font-black text-cyan-400 uppercase block">SD-Access Takeover</span>
          <span className="text-[6px] text-gray-600">7-phase fabric exploitation</span>
        </button>
        <button onClick={() => run(`(cisco/scan-map-servers "${subnet}")`, 'SCAN')} className="p-2 bg-black border border-cyan-900/20 rounded hover:border-cyan-500/30 transition-all">
          <span className="text-[8px] font-black text-cyan-400 uppercase block">Scan Map Servers</span>
          <span className="text-[6px] text-gray-600">UDP 4342 discovery</span>
        </button>
        <button onClick={() => run(`(cisco/encap-packet "10.0.0.1" "10.0.0.2" "172.16.0.1" "172.16.0.2" "test-payload")`, 'ENCAP')} className="p-2 bg-black border border-cyan-900/20 rounded hover:border-cyan-500/30 transition-all">
          <span className="text-[8px] font-black text-cyan-400 uppercase block">Encap Packet</span>
          <span className="text-[6px] text-gray-600">LISP tunnel encapsulation</span>
        </button>
        <button onClick={() => run(`(cisco/gen-map-register-payload "${eid}" "${rloc}")`, 'FORGE')} className="p-2 bg-black border border-cyan-900/20 rounded hover:border-cyan-500/30 transition-all">
          <span className="text-[8px] font-black text-cyan-400 uppercase block">Forge Packet</span>
          <span className="text-[6px] text-gray-600">RFC 9301 Map-Register</span>
        </button>
        <button onClick={() => run('(cisco/node-list)', 'NODES')} className="p-2 bg-black border border-cyan-900/20 rounded hover:border-cyan-500/30 transition-all">
          <span className="text-[8px] font-black text-cyan-400 uppercase block">List Nodes</span>
          <span className="text-[6px] text-gray-600">ITR/ETR/MR/MS</span>
        </button>
        <button onClick={() => run('(cisco/intercepted-packets)', 'INTERCEPT')} className="p-2 bg-black border border-cyan-900/20 rounded hover:border-cyan-500/30 transition-all">
          <span className="text-[8px] font-black text-cyan-400 uppercase block">Intercepted</span>
          <span className="text-[6px] text-gray-600">View captured packets</span>
        </button>
        <button onClick={() => run('(cisco/map-cache-clear)', 'CLEAR')} className="p-2 bg-black border border-cyan-900/20 rounded hover:border-cyan-500/30 transition-all">
          <span className="text-[8px] font-black text-cyan-400 uppercase block">Clear Cache</span>
          <span className="text-[6px] text-gray-600">Flush map cache</span>
        </button>
        <button onClick={() => run(`(cisco-takeover "${fabricDomain}")`, 'FULL')} className="p-2 bg-black border border-red-900/20 rounded hover:border-red-500/30 transition-all">
          <span className="text-[8px] font-black text-red-400 uppercase block">Full Takeover</span>
          <span className="text-[6px] text-gray-600">Complete exploitation chain</span>
        </button>
      </div>

      {/* Output */}
      <div className="bg-black border border-cyan-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-cyan-900/10 bg-cyan-900/5 flex items-center justify-between">
          <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> Cisco LISP Output</span>
          <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-cyan-400 transition-all">Clear</button>
        </div>
        <div className="p-3 h-48 overflow-y-auto custom-scroll font-mono text-[8px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Run Cisco LISP protocol operations above...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('[') ? 'text-cyan-400' : line.includes('ERROR') ? 'text-red-400' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LispCiscoPanel;
