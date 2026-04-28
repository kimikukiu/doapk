import React, { useState, useRef, useEffect } from 'react';

interface QuantumTask {
  id: string;
  type: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  input: string;
  result: string;
  qubits: number;
  timeMs: number;
  timestamp: string;
}

interface QubitState {
  index: number;
  alpha: number;
  beta: number;
  probability0: number;
  probability1: number;
  entangled: boolean;
  phase: number;
}

// Simulated quantum engine
const quantumEngine = {
  initializeQubits(count: number): QubitState[] {
    return Array.from({ length: count }, (_, i) => {
      const a = Math.random();
      const b = Math.sqrt(1 - a * a);
      return {
        index: i,
        alpha: a,
        beta: b,
        probability0: a * a,
        probability1: b * b,
        entangled: Math.random() > 0.6,
        phase: Math.random() * 2 * Math.PI,
      };
    });
  },

  groverSearch(target: string, databaseSize: number): { iterations: number; found: boolean; probability: number; results: string[] } {
    const iterations = Math.ceil(Math.PI / 4 * Math.sqrt(databaseSize));
    const found = Math.random() > 0.05;
    const probability = (95 + Math.random() * 5).toFixed(1);
    const results = found
      ? [`MATCH: "${target}" found at index ${Math.floor(Math.random() * databaseSize)}`, `Confidence: ${probability}%`, `Quantum state collapsed after ${iterations} Grover iterations`]
      : [`NO MATCH: "${target}" not in database`, `Searched ${databaseSize} entries in ${iterations} quantum iterations`];
    return { iterations, found, probability: Number(probability), results };
  },

  shorFactor(n: number): { factors: [number, number]; time: number; qubits: number } {
    const p = 2 + Math.floor(Math.random() * 10);
    const q = 2 + Math.floor(Math.random() * 10);
    return {
      factors: [p, q],
      time: Math.floor(Math.random() * 500) + 50,
      qubits: Math.ceil(Math.log2(n)) * 2 + 3,
    };
  },

  quantumCryptanalysis(cipher: string, keyLen: number): { cracked: boolean; key: string; time: string; method: string } {
    const canCrack = keyLen <= 256;
    if (canCrack) {
      const chars = '0123456789abcdef';
      const key = Array.from({ length: keyLen / 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return { cracked: true, key, time: '0.003ms', method: 'Grover + Shor Hybrid' };
    }
    return { cracked: false, key: '', time: 'ESTIMATED: 47 years (classical) | 3.2 hours (quantum)', method: 'Insufficient qubits' };
  },

  simulateCircuit(gates: string, qubits: number): string[] {
    const lines = [
      `[QASM] Initializing ${qubits}-qubit register...`,
      `[QASM] |0⟩ state prepared for all qubits`,
      `[QASM] Applying gate sequence: ${gates}`,
    ];
    const gateList = gates.split(/\s+/).filter(Boolean);
    gateList.forEach((gate, i) => {
      const target = Math.floor(Math.random() * qubits);
      const control = target === 0 ? 1 : 0;
      lines.push(`[QASM] Step ${i + 1}: ${gate.replace(/q\d+/g, m => `q${Math.floor(Math.random() * qubits)}`)} applied`);
    });
    lines.push(`[MEASURE] Collapsing quantum state...`);
    lines.push(`[RESULT] Final state: |${Array.from({ length: qubits }, () => Math.random() > 0.5 ? '1' : '0').join('')}⟩`);
    lines.push(`[STATS] Circuit depth: ${gateList.length}, Qubits: ${qubits}`);
    return lines;
  }
};

export default function QuantumTool() {
  const [activeTab, setActiveTab] = useState<'grover' | 'shor' | 'crypto' | 'circuit'>('grover');
  const [groverTarget, setGroverTarget] = useState('');
  const [groverDbSize, setGroverDbSize] = useState(1000000);
  const [shorN, setShorN] = useState(15);
  const [cryptoCipher, setCryptoCipher] = useState('AES-256');
  const [cryptoKeyLen, setCryptoKeyLen] = useState(256);
  const [circuitGates, setCircuitGates] = useState('H q0 CNOT q0 q1 H q1');
  const [circuitQubits, setCircuitQubits] = useState(4);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Quantum Intelligence Ultra Processor V4.0 online.',
    '[QPU] Simulated 128-qubit quantum processor initialized.',
    '[READY] Awaiting quantum computation request...'
  ]);
  const [qubits, setQubits] = useState<QubitState[]>([]);
  const [tasks, setTasks] = useState<QuantumTask[]>([]);
  const [circuitOutput, setCircuitOutput] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs, circuitOutput]);

  const addLog = (msg: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const ts = new Date().toLocaleTimeString();
    const pfx = level === 'success' ? '[+]' : level === 'error' ? '[!]' : level === 'warning' ? '[*]' : '[_]';
    setLogs(prev => [...prev.slice(-100), `${ts} ${pfx} ${msg}`]);
  };

  const addTask = (task: Omit<QuantumTask, 'id' | 'timestamp'>) => {
    setTasks(prev => [{ ...task, id: Date.now().toString(36), timestamp: new Date().toISOString() }, ...prev]);
  };

  const runGrover = () => {
    if (!groverTarget) return;
    setIsProcessing(true);
    addLog(`Grover's Algorithm: Searching for "${groverTarget}" in ${groverDbSize.toLocaleString()} entries...`, 'warning');
    setTimeout(() => {
      const result = quantumEngine.groverSearch(groverTarget, groverDbSize);
      result.results.forEach(r => addLog(r, result.found ? 'success' : 'info'));
      addTask({ type: 'Grover Search', status: result.found ? 'complete' : 'error', input: groverTarget, result: result.results.join('; '), qubits: Math.ceil(Math.log2(groverDbSize)) * 2, timeMs: result.iterations * 0.001 });
      setIsProcessing(false);
    }, 1800);
  };

  const runShor = () => {
    setIsProcessing(true);
    addLog(`Shor's Algorithm: Factoring N=${shorN}...`, 'warning');
    setTimeout(() => {
      const result = quantumEngine.shorFactor(shorN);
      addLog(`Factors: ${result.factors[0]} × ${result.factors[1]}`, 'success');
      addLog(`Computation time: ${result.time}ms | Qubits used: ${result.qubits}`, 'info');
      addTask({ type: 'Shor Factorization', status: 'complete', input: `N=${shorN}`, result: `${result.factors[0]} × ${result.factors[1]}`, qubits: result.qubits, timeMs: result.time });
      setIsProcessing(false);
    }, 2200);
  };

  const runCrypto = () => {
    setIsProcessing(true);
    addLog(`Quantum Cryptanalysis: ${cryptoCipher} (${cryptoKeyLen}-bit)...`, 'warning');
    setTimeout(() => {
      const result = quantumEngine.quantumCryptanalysis(cryptoCipher, cryptoKeyLen);
      if (result.cracked) {
        addLog(`CRACKED! Key: ${result.key}`, 'success');
        addLog(`Method: ${result.method} | Time: ${result.time}`, 'info');
      } else {
        addLog(`Cannot crack: ${result.time}`, 'error');
      }
      addTask({ type: 'Cryptanalysis', status: result.cracked ? 'complete' : 'error', input: `${cryptoCipher} ${cryptoKeyLen}-bit`, result: result.cracked ? `Key: ${result.key}` : 'Insufficient qubits', qubits: cryptoKeyLen * 2, timeMs: 0 });
      setIsProcessing(false);
    }, 1500);
  };

  const runCircuit = () => {
    if (!circuitGates.trim()) return;
    setIsProcessing(true);
    setCircuitOutput([]);
    setQubits(quantumEngine.initializeQubits(circuitQubits));
    addLog(`Simulating quantum circuit: ${circuitGates} (${circuitQubits} qubits)...`, 'warning');
    const lines = quantumEngine.simulateCircuit(circuitGates, circuitQubits);
    lines.forEach((line, i) => {
      setTimeout(() => {
        setCircuitOutput(prev => [...prev, line]);
        if (i === lines.length - 1) {
          addLog('Circuit simulation complete.', 'success');
          setIsProcessing(false);
        }
      }, (i + 1) * 400);
    });
  };

  const tabs = [
    { id: 'grover' as const, label: "Grover", icon: 'fa-search' },
    { id: 'shor' as const, label: 'Shor', icon: 'fa-superscript' },
    { id: 'crypto' as const, label: 'Crypto', icon: 'fa-key' },
    { id: 'circuit' as const, label: 'Circuit', icon: 'fa-project-diagram' },
  ];

  return (
    <div className="p-4 space-y-4 bg-black border border-cyan-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-cyan-400 uppercase tracking-tighter">
          <i className="fas fa-atom mr-2"></i>QUANTUM INTELLIGENCE ULTRA
        </h2>
        <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs rounded font-bold animate-pulse">
          QPU ONLINE
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/40 border border-cyan-900/20 rounded p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-xs font-black uppercase rounded transition-all ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <i className={`fas ${tab.icon} mr-1`}></i>{tab.label}
          </button>
        ))}
      </div>

      {/* Grover Tab */}
      {activeTab === 'grover' && (
        <div className="space-y-3">
          <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
            <label className="text-cyan-400 text-xs font-black uppercase block mb-2">
              <i className="fas fa-search mr-1"></i>Grover's Search Algorithm
            </label>
            <input type="text" value={groverTarget} onChange={e => setGroverTarget(e.target.value)}
              placeholder="Target search value..."
              className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-sm outline-none focus:border-cyan-500/50 mb-2" />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-gray-500 text-[10px] uppercase">Database Size</label>
                <input type="number" value={groverDbSize} onChange={e => setGroverDbSize(Number(e.target.value))}
                  className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-sm outline-none" />
              </div>
              <button onClick={runGrover} disabled={isProcessing || !groverTarget}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
                {isProcessing ? <><i className="fas fa-spinner fa-spin mr-1"></i>Running</> : <><i className="fas fa-play mr-1"></i>Run</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shor Tab */}
      {activeTab === 'shor' && (
        <div className="space-y-3">
          <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
            <label className="text-cyan-400 text-xs font-black uppercase block mb-2">
              <i className="fas fa-superscript mr-1"></i>Shor's Factoring Algorithm
            </label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-gray-500 text-[10px] uppercase">Integer N</label>
                <input type="number" value={shorN} onChange={e => setShorN(Number(e.target.value))}
                  className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-sm outline-none" />
              </div>
              <button onClick={runShor} disabled={isProcessing}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
                {isProcessing ? <><i className="fas fa-spinner fa-spin mr-1"></i>Running</> : <><i className="fas fa-play mr-1"></i>Run</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crypto Tab */}
      {activeTab === 'crypto' && (
        <div className="space-y-3">
          <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
            <label className="text-cyan-400 text-xs font-black uppercase block mb-2">
              <i className="fas fa-key mr-1"></i>Quantum Cryptanalysis
            </label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-gray-500 text-[10px] uppercase">Cipher</label>
                <select value={cryptoCipher} onChange={e => setCryptoCipher(e.target.value)}
                  className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 text-sm outline-none">
                  <option>AES-128</option><option>AES-192</option><option>AES-256</option>
                  <option>RSA-2048</option><option>RSA-4096</option><option>ECC-256</option>
                </select>
              </div>
              <div>
                <label className="text-gray-500 text-[10px] uppercase">Key (bits)</label>
                <input type="number" value={cryptoKeyLen} onChange={e => setCryptoKeyLen(Number(e.target.value))}
                  className="w-24 bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-sm outline-none" />
              </div>
              <button onClick={runCrypto} disabled={isProcessing}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
                {isProcessing ? <><i className="fas fa-spinner fa-spin mr-1"></i>Cracking</> : <><i className="fas fa-bomb mr-1"></i>Crack</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circuit Tab */}
      {activeTab === 'circuit' && (
        <div className="space-y-3">
          <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
            <label className="text-cyan-400 text-xs font-black uppercase block mb-2">
              <i className="fas fa-project-diagram mr-1"></i>Quantum Circuit Simulator
            </label>
            <textarea value={circuitGates} onChange={e => setCircuitGates(e.target.value)} rows={2}
              placeholder="H q0  CNOT q0 q1  H q1  MEASURE"
              className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-xs outline-none focus:border-cyan-500/50 resize-none mb-2" />
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-gray-500 text-[10px] uppercase">Qubits</label>
                <input type="number" value={circuitQubits} onChange={e => setCircuitQubits(Number(e.target.value))}
                  className="w-20 bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-sm outline-none" />
              </div>
              <button onClick={runCircuit} disabled={isProcessing || !circuitGates.trim()}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
                {isProcessing ? <><i className="fas fa-spinner fa-spin mr-1"></i>Simulating</> : <><i className="fas fa-play mr-1"></i>Simulate</>}
              </button>
            </div>
          </div>
          {circuitOutput.length > 0 && (
            <div className="bg-black/60 border border-cyan-900/10 rounded p-2 h-48 overflow-y-auto font-mono text-xs">
              {circuitOutput.map((line, i) => (
                <div key={i} className={line.includes('[RESULT]') ? 'text-cyan-400 font-bold' : line.includes('[MEASURE]') ? 'text-yellow-400' : 'text-gray-400'}>
                  {line}
                </div>
              ))}
            </div>
          )}
          {/* Qubit States */}
          {qubits.length > 0 && (
            <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
              <span className="text-cyan-400 font-bold text-xs block mb-2"><i className="fas fa-atom mr-1"></i>Qubit Register State</span>
              <div className="grid grid-cols-4 gap-2">
                {qubits.map(q => (
                  <div key={q.index} className={`bg-black/60 border rounded p-2 text-center ${q.entangled ? 'border-cyan-500/30' : 'border-gray-800'}`}>
                    <div className="text-gray-500 text-[10px]">q{q.index}</div>
                    <div className="text-cyan-400 font-bold text-xs">|{q.probability1 > 0.5 ? '1' : '0'}⟩</div>
                    <div className="text-gray-500 text-[10px]">{(q.probability1 * 100).toFixed(0)}%</div>
                    {q.entangled && <div className="text-cyan-500 text-[8px]">ENTANGLED</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task History */}
      {tasks.length > 0 && (
        <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
          <span className="text-cyan-400 font-bold text-xs block mb-2"><i className="fas fa-history mr-1"></i>Task History</span>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {tasks.map((t, i) => (
              <div key={i} className="flex items-center justify-between bg-black/60 rounded px-2 py-1 text-[10px]">
                <span className="text-gray-400">{t.type}: {t.input}</span>
                <span className={`font-bold ${t.status === 'complete' ? 'text-emerald-400' : 'text-red-400'}`}>{t.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-cyan-900/20 rounded p-3">
        <label className="text-cyan-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-terminal mr-1"></i>System Logs
        </label>
        <div ref={messagesEndRef} className="bg-black/60 border border-cyan-900/10 rounded p-2 h-28 overflow-y-auto font-mono text-xs text-gray-400">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}
