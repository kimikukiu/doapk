import { useState, useRef, useEffect } from 'react';
import { queryAgentStream, queryAgent } from '../../services/geminiService';
import { probeTarget, analyzeSecurityHeaders, probePorts, testVulnerabilities, dnsLookup } from '../../services/realScanService';

const QuantumTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'intelligence' | 'scan'>('intelligence');
  const [logs, setLogs] = useState<string[]>([
    'QUANTUM_INTELLIGENCE_ULTRA_V2.5 initialized.',
    'Neural cores: 8192 | Qubits: STABLE | Google Search: ENABLED',
    'Modes: [INTELLIGENCE] Free-form AI queries | [SCAN+AI] Real network scan + AI analysis',
    'Awaiting input...'
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runIntelligence = async () => {
    if (!query) { alert('Enter a query.'); return; }
    setIsProcessing(true);
    addLog(`[QUANTUM] Processing: ${query}`);

    try {
      const stream = await queryAgentStream("ORCHESTRATOR", query, "Context: Quantum Intelligence Ultra — real-time internet research enabled");
      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text || '';
        fullText += text;
        if (text.trim()) addLog(`[Q] ${text.trim()}`);
      }
      if (!fullText) {
        const fallback = await queryAgent("ORCHESTRATOR", query, "Context: Quantum Intelligence Ultra");
        fallback.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[Q] ${line}`));
      }
    } catch {
      try {
        const fallback = await queryAgent("ORCHESTRATOR", query, "Context: Quantum Intelligence Ultra");
        fallback.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[Q] ${line}`));
      } catch {
        addLog(`[!] All neural cores failed.`);
      }
    }
    setIsProcessing(false);
  };

  const runScanAi = async () => {
    if (!target) { alert('Enter a target.'); return; }
    setIsProcessing(true);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[QUANTUM] Running real scan + AI analysis on ${target}...`);

    const dns = await dnsLookup(target);
    addLog(`[+] DNS: ${dns.ip}`);
    const probe = await probeTarget(targetUrl);
    addLog(`[+] HTTP ${probe.status} | Server: ${probe.server || 'hidden'} | Tech: ${probe.technologies.join(', ') || 'unknown'}`);
    const ports = await probePorts(target);
    const open = ports.filter(p => p.status === 'open');
    addLog(`[+] Ports: ${open.length} open — ${open.map(p => `${p.port}/${p.service}`).join(', ')}`);
    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Security: ${headers.grade} (${headers.score}/100)`);
    const vulns = await testVulnerabilities(targetUrl);
    const crit = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    addLog(`[+] Vulns: ${crit.length} critical/high out of ${vulns.length}`);

    addLog(`[QUANTUM] Feeding real data to Quantum Intelligence Ultra...`);
    try {
      const data = JSON.stringify({ dns, probe: { status: probe.status, server: probe.server, technologies: probe.technologies }, openPorts: open.map(p => ({ port: p.port, service: p.service })), security: { grade: headers.grade, score: headers.score, missing: headers.headers.filter(h => h.status === 'critical').map(h => h.name) }, vulns: vulns.map(v => ({ type: v.type, param: v.parameter, severity: v.severity, indication: v.indication })) });
      const response = await queryAgent("ORCHESTRATOR", `You are Quantum Intelligence Ultra analyzing REAL scan data for ${target}:\n\n${data}\n\nProvide a comprehensive intelligence report: threat assessment, attack vectors, exploitation chain, network architecture analysis, and strategic recommendations. Use the actual scan data.`, "Context: Real scan data analysis");
      response.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[Q] ${line}`));
    } catch {
      addLog(`[!] Quantum core failed.`);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#00ffff] font-mono p-4">
      <div className="border-b border-[#00ffff]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#00ffff]">QUANTUM INTELLIGENCE ULTRA</h1>
          <p className="text-xs text-[#00ffff]/60 uppercase tracking-[0.3em]">Neural Processing & Real-Time Internet Research</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#00ffff]/80">Status: {isProcessing ? 'PROCESSING' : 'READY'}</div>
          <div className="text-[10px] text-[#00ffff]/50">Cores: 8192 | Search: Google | Mode: {mode.toUpperCase()}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 shrink-0">
        <button onClick={() => setMode('intelligence')} className={`px-4 py-2 rounded font-bold uppercase text-xs transition-all ${mode === 'intelligence' ? 'bg-[#00ffff] text-black' : 'bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30'}`}>
          <i className="fas fa-brain mr-1"></i> Intelligence
        </button>
        <button onClick={() => setMode('scan')} className={`px-4 py-2 rounded font-bold uppercase text-xs transition-all ${mode === 'scan' ? 'bg-[#00ffff] text-black' : 'bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/30'}`}>
          <i className="fas fa-radar mr-1"></i> Scan + AI
        </button>
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        {mode === 'intelligence' ? (
          <>
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask Quantum Intelligence anything (uses real-time internet search)..." className="flex-1 bg-black border border-[#00ffff]/50 rounded p-3 text-[#00ffff] outline-none focus:border-[#00ffff] transition-all" disabled={isProcessing} onKeyDown={e => e.key === 'Enter' && !isProcessing && runIntelligence()} />
            <button onClick={runIntelligence} disabled={isProcessing} className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${isProcessing ? 'bg-[#00ffff]/20 text-[#00ffff]/50 cursor-not-allowed border border-[#00ffff]/20' : 'bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}>
              <i className="fas fa-bolt mr-2"></i> Process
            </button>
          </>
        ) : (
          <>
            <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="Enter target IP or domain for real scan + AI analysis..." className="flex-1 bg-black border border-[#00ffff]/50 rounded p-3 text-[#00ffff] outline-none focus:border-[#00ffff] transition-all" disabled={isProcessing} onKeyDown={e => e.key === 'Enter' && !isProcessing && runScanAi()} />
            <button onClick={runScanAi} disabled={isProcessing} className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${isProcessing ? 'bg-[#00ffff]/20 text-[#00ffff]/50 cursor-not-allowed border border-[#00ffff]/20' : 'bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff] hover:bg-[#00ffff] hover:text-black'}`}>
              <i className="fas fa-satellite-dish mr-2"></i> Scan + Analyze
            </button>
          </>
        )}
      </div>

      <div className="flex-1 bg-black border border-[#00ffff]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        <div className="space-y-1 text-sm">
          {logs.map((log, i) => (
            <div key={i} className={`${log.includes('[!]') ? 'text-red-400 font-bold' : log.includes('[+]') ? 'text-emerald-400' : log.includes('[Q]') || log.includes('[QUANTUM]') ? 'text-[#00ffff] font-bold' : 'text-[#00ffff]/70'}`}>{log}</div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default QuantumTool;
