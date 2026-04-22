import { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';
import { probeTarget, analyzeSecurityHeaders, probePorts, testVulnerabilities, bruteforceDirectories, crawlTarget, dnsLookup } from '../../services/realScanService';

interface ExtractedData {
  name: string;
  size: string;
  content: string;
  type: string;
}

export default function LazarusTool() {
  const [target, setTarget] = useState('');
  const [wallet, setWallet] = useState(() => localStorage.getItem('lazarus_wallet') || '');
  const [amount, setAmount] = useState('');
  const [isAttacking, setIsAttacking] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'LAZARUS_APT38_CORE initialized.',
    'All operations perform REAL network reconnaissance.',
    'Configure your extraction wallet and target amount below.',
    'Awaiting target financial/crypto institution...'
  ]);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const downloadFile = (file: ExtractedData) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addLog(`[+] Downloaded: ${file.name}`);
  };

  const startInfiltration = async () => {
    if (!target) {
      alert('Please enter a target institution or domain.');
      return;
    }

    setIsAttacking(true);
    setExtractedData([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[!] INITIATING LAZARUS APT RECON ON: ${target}`);

    // Phase 1: DNS Intelligence
    addLog(`[*] Phase 1: DNS intelligence gathering...`);
    const dns = await dnsLookup(target);
    addLog(`[+] Resolved IP: ${dns.ip}`);
    Object.entries(dns.records).forEach(([type, records]) => {
      if (records.length > 0) addLog(`[+] ${type}: ${records.join(', ')}`);
    });

    // Phase 2: Infrastructure fingerprinting
    addLog(`[*] Phase 2: Financial infrastructure fingerprinting...`);
    const probe = await probeTarget(targetUrl);
    if (probe.error) {
      addLog(`[!] Probe error: ${probe.error}`);
    } else {
      addLog(`[+] HTTP ${probe.status} ${probe.statusText} (${probe.responseTime}ms)`);
      addLog(`[+] Server: ${probe.server || 'Hidden'}`);
      if (probe.technologies.length > 0) addLog(`[+] Technology stack: ${probe.technologies.join(', ')}`);
    }

    // Phase 3: Service enumeration (financial ports)
    addLog(`[*] Phase 3: Financial service port scanning...`);
    const financialPorts = [80, 443, 8080, 8443, 3000, 3306, 5432, 6379, 27017, 22, 21, 25, 993, 8888, 9090, 8000, 4443, 10443];
    const ports = await probePorts(target, financialPorts);
    const openPorts = ports.filter(p => p.status === 'open');
    openPorts.forEach(p => addLog(`[+] PORT ${p.port} OPEN — ${p.service} (${p.responseTime}ms)`));
    addLog(`[+] ${openPorts.length} open services on target infrastructure`);

    setExtractedData(prev => [...prev, {
      name: 'infrastructure_scan.json',
      size: `${JSON.stringify({ dns, probe, ports }, null, 2).length} bytes`,
      type: 'Infrastructure Intelligence',
      content: JSON.stringify({ dns, probe, ports }, null, 2),
    }]);

    // Phase 4: Security posture assessment
    addLog(`[*] Phase 4: Security posture assessment...`);
    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Security Grade: ${headers.grade} (${headers.score}/100)`);
    headers.headers.filter(h => h.status === 'critical').forEach(h => {
      addLog(`[!] WEAKNESS: ${h.name} — ${h.description}`);
    });

    // Phase 5: Attack surface discovery
    addLog(`[*] Phase 5: Attack surface mapping...`);
    const dirs = await bruteforceDirectories(targetUrl, (path, status) => {
      addLog(`[+] EXPOSED: ${path} (HTTP ${status})`);
    });

    const crawl = await crawlTarget(targetUrl);
    addLog(`[+] Spider: ${crawl.links.length} endpoints, ${crawl.forms.length} forms, ${crawl.scripts.length} scripts`);

    if (dirs.length > 0) {
      setExtractedData(prev => [...prev, {
        name: 'attack_surface.txt',
        size: `${dirs.length} entries`,
        type: 'Attack Surface Map',
        content: dirs.map(d => `${d.path} — HTTP ${d.status} (${d.size} bytes)`).join('\n'),
      }]);
    }

    // Phase 6: Vulnerability probing
    addLog(`[*] Phase 6: Injecting exploit payloads...`);
    const vulns = await testVulnerabilities(targetUrl);
    const critical = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    vulns.forEach(v => {
      const tag = v.severity === 'critical' ? '[!] CRITICAL' : v.severity === 'high' ? '[!] HIGH' : `[*] ${v.severity.toUpperCase()}`;
      addLog(`${tag}: ${v.type} | ${v.parameter} | ${v.indication}`);
    });

    setExtractedData(prev => [...prev, {
      name: 'lazarus_full_recon.json',
      size: `${JSON.stringify({ dns, probe, ports, headers, dirs, vulns, crawl }, null, 2).length} bytes`,
      type: 'Full APT Recon Report',
      content: JSON.stringify({ dns, probe, ports, headers, dirs, vulns, crawl }, null, 2),
    }]);

    addLog(`[!] LAZARUS RECON COMPLETE. ${critical.length} critical/high vulns, ${openPorts.length} services, ${dirs.length} exposed paths.`);
    setIsAttacking(false);
  };

  const startQuantumAi = async () => {
    if (!target) {
      alert('Please enter a target for Quantum Intelligence Ultra.');
      return;
    }

    setIsAiAssisting(true);
    setIsAttacking(true);
    setExtractedData([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[AI] Quantum Intelligence taking control of Lazarus APT...`);
    addLog(`[AI] Running real financial infrastructure recon on ${target}...`);

    // Real recon
    const dns = await dnsLookup(target);
    addLog(`[+] DNS: ${dns.ip}`);

    const probe = await probeTarget(targetUrl);
    addLog(`[+] HTTP ${probe.status} | Server: ${probe.server || 'hidden'} | Tech: ${probe.technologies.join(', ') || 'unknown'}`);

    const ports = await probePorts(target);
    const openPorts = ports.filter(p => p.status === 'open');
    addLog(`[+] Ports: ${openPorts.length} open — ${openPorts.map(p => `${p.port}/${p.service}`).join(', ')}`);

    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Security: ${headers.grade} (${headers.score}/100)`);

    const vulns = await testVulnerabilities(targetUrl);
    const critVulns = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    addLog(`[+] Vulns: ${critVulns.length} critical/high out of ${vulns.length}`);

    addLog(`[AI] Feeding real recon to Quantum Intelligence for APT planning...`);
    try {
      const realData = JSON.stringify({
        dns, probe: { status: probe.status, server: probe.server, technologies: probe.technologies },
        openPorts: openPorts.map(p => ({ port: p.port, service: p.service })),
        securityGrade: { grade: headers.grade, score: headers.score },
        vulnerabilities: vulns.map(v => ({ type: v.type, param: v.parameter, severity: v.severity, indication: v.indication })),
      });

      const prompt = `You are Quantum Intelligence Ultra analyzing REAL reconnaissance data from a Lazarus APT38 campaign against financial target ${target}:\n\n${realData}\n\nProvide a professional APT exploitation plan: initial access vectors based on open ports and vulns, lateral movement strategy, financial system targeting (SWIFT, trading platforms), data exfiltration plan, and anti-forensics. Reference actual scan data. Be specific and technical.`;

      const response = await queryAgent("ORCHESTRATOR", prompt, "Context: Real Lazarus APT recon data analysis");
      response.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[AI] ${line}`));

      setExtractedData(prev => [...prev, {
        name: 'quantum_apt_plan.txt',
        size: `${response.length} bytes`,
        type: 'AI APT Plan (Real Data)',
        content: `Target: ${target}\nQuantum APT Report:\n\n${response}`,
      }, {
        name: 'raw_recon.json',
        size: `${realData.length} bytes`,
        type: 'Raw Recon Data',
        content: realData,
      }]);

      addLog(`[AI] Real-data APT analysis complete.`);
    } catch (error) {
      addLog(`[!] Quantum Core connection failed. Raw scan data still available.`);
    }

    setIsAiAssisting(false);
    setIsAttacking(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#991b1b] font-mono p-4">
      <div className="border-b border-[#991b1b]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#991b1b]">LAZARUS APT38</h1>
          <p className="text-xs text-[#991b1b]/60 uppercase tracking-[0.3em]">State-Sponsored Financial Exploitation</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#991b1b]/80">Status: {isAttacking ? (isAiAssisting ? 'QUANTUM-AUTOPILOT' : 'INFILTRATING') : 'STANDBY'}</div>
          <div className="text-[10px] text-[#991b1b]/50">Routing: Multi-Hop Proxy | Stealth: MAXIMUM</div>
        </div>
      </div>

      {/* Wallet & Amount Config */}
      <div className="flex gap-4 mb-4 shrink-0">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-[#991b1b]/60">Extraction Wallet (BTC/ETH/XMR)</label>
          <input type="text" value={wallet} onChange={e => { setWallet(e.target.value); localStorage.setItem('lazarus_wallet', e.target.value); }} placeholder="Enter your crypto wallet address..." className="bg-black border border-orange-800/40 rounded p-2 text-orange-300 text-xs outline-none focus:border-orange-500 font-mono transition-all" disabled={isAttacking} />
        </div>
        <div className="w-48 flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold text-[#991b1b]/60">Target Amount (USD)</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 50000000" className="bg-black border border-orange-800/40 rounded p-2 text-orange-300 text-xs outline-none focus:border-orange-500 font-mono transition-all" disabled={isAttacking} />
        </div>
        {wallet && <div className="flex items-end"><span className="text-[8px] text-green-500 pb-2"><i className="fas fa-check-circle mr-1"></i>Wallet: {wallet.slice(0,6)}...{wallet.slice(-6)}</span></div>}
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target institution (e.g., bank.com, crypto-exchange.io)..."
          className="flex-1 bg-black border border-[#991b1b]/50 rounded p-3 text-[#991b1b] outline-none focus:border-[#991b1b] focus:shadow-[0_0_10px_rgba(153,27,27,0.2)] transition-all"
          disabled={isAttacking}
          onKeyDown={e => e.key === 'Enter' && !isAttacking && startInfiltration()}
        />
        <button
          onClick={startInfiltration}
          disabled={isAttacking}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isAttacking 
              ? 'bg-[#991b1b]/20 text-[#991b1b]/50 cursor-not-allowed border border-[#991b1b]/20' 
              : 'bg-[#991b1b]/10 text-[#991b1b] border border-[#991b1b] hover:bg-[#991b1b] hover:text-black hover:shadow-[0_0_15px_#991b1b]'
          }`}
        >
          <i className="fas fa-network-wired mr-2"></i> Infiltrate
        </button>
        <button
          onClick={startQuantumAi}
          disabled={isAttacking}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isAttacking 
              ? 'bg-[#00ffc3]/20 text-[#00ffc3]/50 cursor-not-allowed border border-[#00ffc3]/20' 
              : 'bg-[#00ffc3]/10 text-[#00ffc3] border border-[#00ffc3] hover:bg-[#00ffc3] hover:text-black hover:shadow-[0_0_15px_#00ffc3]'
          }`}
        >
          <i className="fas fa-atom mr-2"></i> Quantum Ultra AI
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-black border border-[#991b1b]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <div className="space-y-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[!]') ? 'text-white font-bold bg-red-800/40 px-1 inline-block' : log.includes('[+]') ? 'text-emerald-500' : log.includes('[🧠') || log.includes('[🤖') ? 'text-[#00ffc3] font-bold' : 'text-[#991b1b]/80'}`}>
                {log}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {extractedData.length > 0 && (
          <div className="w-full lg:w-1/3 bg-[#0a0a0a] border border-[#991b1b]/50 rounded-lg p-4 flex flex-col shadow-[0_0_15px_rgba(153,27,27,0.1)]">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b border-[#991b1b]/30 pb-2">Exfiltrated Assets</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {extractedData.map((file, idx) => (
                <div key={idx} className="bg-black border border-[#991b1b]/20 p-3 rounded flex flex-col gap-2 hover:border-[#991b1b]/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{file.name}</span>
                      <span className="text-[10px] text-[#991b1b]/60">Type: {file.type}</span>
                      <span className="text-[10px] text-[#991b1b]/60">Size: {file.size}</span>
                    </div>
                    <button 
                      onClick={() => downloadFile(file)}
                      className="bg-[#991b1b]/20 hover:bg-[#991b1b] hover:text-black text-[#991b1b] w-8 h-8 rounded flex items-center justify-center transition-all"
                      title="Download File"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
