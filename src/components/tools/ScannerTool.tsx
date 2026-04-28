import { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';
import { probeTarget, analyzeSecurityHeaders, probePorts, testVulnerabilities, bruteforceDirectories, crawlTarget, dnsLookup } from '../../services/realScanService';

interface ExtractedFile {
  name: string;
  size: string;
  content: string;
  type: string;
}

const ScannerTool: React.FC = () => {
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'NETWORK_SCANNER_V3.0 initialized.',
    'All scans perform REAL network requests.',
    'Awaiting target specification...'
  ]);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const downloadFile = (file: ExtractedFile) => {
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

  const startScan = async () => {
    if (!target) { alert('Please enter a target.'); return; }
    setIsScanning(true);
    setExtractedFiles([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[!] INITIATING FULL NETWORK SCAN ON: ${target}`);

    // DNS
    addLog(`[*] Phase 1: DNS resolution...`);
    const dns = await dnsLookup(target);
    addLog(`[+] IP: ${dns.ip}`);
    Object.entries(dns.records).forEach(([type, records]) => {
      if (records.length > 0) addLog(`[+] ${type}: ${records.join(', ')}`);
    });

    // Probe
    addLog(`[*] Phase 2: HTTP probe...`);
    const probe = await probeTarget(targetUrl);
    if (probe.error) {
      addLog(`[!] Error: ${probe.error}`);
    } else {
      addLog(`[+] HTTP ${probe.status} ${probe.statusText} (${probe.responseTime}ms)`);
      addLog(`[+] Server: ${probe.server || 'Hidden'} | Type: ${probe.contentType}`);
      if (probe.technologies.length > 0) addLog(`[+] Tech: ${probe.technologies.join(', ')}`);
    }

    // Ports
    addLog(`[*] Phase 3: Port scan (18 ports)...`);
    const ports = await probePorts(target);
    const open = ports.filter(p => p.status === 'open');
    const filtered = ports.filter(p => p.status === 'filtered');
    open.forEach(p => addLog(`[+] PORT ${p.port} OPEN — ${p.service} (${p.responseTime}ms)`));
    if (filtered.length > 0) addLog(`[*] Filtered: ${filtered.map(p => p.port).join(', ')}`);
    addLog(`[+] ${open.length} open, ${filtered.length} filtered, ${ports.length - open.length - filtered.length} closed`);

    // Headers
    addLog(`[*] Phase 4: Security headers...`);
    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Grade: ${headers.grade} (${headers.score}/100)`);
    headers.headers.filter(h => h.status === 'critical').forEach(h => addLog(`[!] ${h.name}: ${h.description}`));

    // Directories
    addLog(`[*] Phase 5: Directory enumeration...`);
    const dirs = await bruteforceDirectories(targetUrl, (path, status) => addLog(`[+] ${path} (HTTP ${status})`));

    // Vulns
    addLog(`[*] Phase 6: Vulnerability testing...`);
    const vulns = await testVulnerabilities(targetUrl);
    const critical = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    vulns.forEach(v => {
      const tag = v.severity === 'critical' ? '[!]' : v.severity === 'high' ? '[!]' : '[*]';
      addLog(`${tag} ${v.type} | ${v.parameter} | ${v.indication}`);
    });

    // Crawl
    addLog(`[*] Phase 7: Web crawl...`);
    const crawl = await crawlTarget(targetUrl);
    addLog(`[+] Links: ${crawl.links.length} | Forms: ${crawl.forms.length} | Scripts: ${crawl.scripts.length}`);

    const report = { dns, probe, ports, headers, dirs, vulns, crawl };
    setExtractedFiles([{
      name: 'network_scan_report.json',
      size: `${JSON.stringify(report, null, 2).length} bytes`,
      type: 'Full Network Scan',
      content: JSON.stringify(report, null, 2),
    }]);

    addLog(`[!] SCAN COMPLETE. ${critical.length} critical/high, ${open.length} open ports, ${dirs.length} paths.`);
    setIsScanning(false);
  };

  const startAiScan = async () => {
    if (!target) { alert('Please enter a target.'); return; }
    setIsAiAssisting(true);
    setIsScanning(true);
    setExtractedFiles([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[AI] Running real network scan on ${target}...`);

    const dns = await dnsLookup(target);
    const probe = await probeTarget(targetUrl);
    const ports = await probePorts(target);
    const headers = await analyzeSecurityHeaders(targetUrl);
    const vulns = await testVulnerabilities(targetUrl);
    const open = ports.filter(p => p.status === 'open');
    const critVulns = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    addLog(`[+] DNS: ${dns.ip} | HTTP ${probe.status} | ${open.length} ports | Grade: ${headers.grade} | ${critVulns.length} vulns`);

    addLog(`[AI] Analyzing real scan data...`);
    try {
      const data = JSON.stringify({ dns, probe: { status: probe.status, server: probe.server, technologies: probe.technologies }, openPorts: open.map(p => ({ port: p.port, service: p.service })), security: { grade: headers.grade, score: headers.score }, vulns: vulns.map(v => ({ type: v.type, param: v.parameter, severity: v.severity, indication: v.indication })) });
      const response = await queryAgent("ORCHESTRATOR", `Analyze these REAL network scan results for ${target}:\n\n${data}\n\nProvide a complete security assessment: attack surface analysis, exploitation paths, risk rating, and remediation priorities. Reference the actual data.`, "Context: Real network scan analysis");
      response.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[AI] ${line}`));
      setExtractedFiles([{ name: 'ai_network_report.txt', size: `${response.length} bytes`, type: 'AI Analysis', content: `Target: ${target}\n\n${response}` }, { name: 'raw_scan.json', size: `${data.length} bytes`, type: 'Raw Data', content: data }]);
    } catch { addLog(`[!] AI failed. Raw data available.`); }

    setIsAiAssisting(false);
    setIsScanning(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#ff00ff] font-mono p-4">
      <div className="border-b border-[#ff00ff]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#ff00ff]">NETWORK SCANNER</h1>
          <p className="text-xs text-[#ff00ff]/60 uppercase tracking-[0.3em]">Deep-Packet Inspection & Vulnerability Mapping</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#ff00ff]/80">Status: {isScanning ? (isAiAssisting ? 'AI-AUTOPILOT' : 'SCANNING') : 'STANDBY'}</div>
          <div className="text-[10px] text-[#ff00ff]/50">Mode: Aggressive | Threads: 20</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="Enter target IP or domain..." className="flex-1 bg-black border border-[#ff00ff]/50 rounded p-3 text-[#ff00ff] outline-none focus:border-[#ff00ff] focus:shadow-[0_0_10px_rgba(255,0,255,0.2)] transition-all" disabled={isScanning} onKeyDown={e => e.key === 'Enter' && !isScanning && startScan()} />
        <button onClick={startScan} disabled={isScanning} className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${isScanning ? 'bg-[#ff00ff]/20 text-[#ff00ff]/50 cursor-not-allowed border border-[#ff00ff]/20' : 'bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff] hover:bg-[#ff00ff] hover:text-black hover:shadow-[0_0_15px_#ff00ff]'}`}>
          <i className="fas fa-network-wired mr-2"></i> Full Scan
        </button>
        <button onClick={startAiScan} disabled={isScanning} className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${isScanning ? 'bg-[#00ffc3]/20 text-[#00ffc3]/50 cursor-not-allowed border border-[#00ffc3]/20' : 'bg-[#00ffc3]/10 text-[#00ffc3] border border-[#00ffc3] hover:bg-[#00ffc3] hover:text-black hover:shadow-[0_0_15px_#00ffc3]'}`}>
          <i className="fas fa-brain mr-2"></i> AI Analysis
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-black border border-[#ff00ff]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <div className="space-y-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[!]') ? 'text-red-400 font-bold' : log.includes('[+]') ? 'text-emerald-400' : log.includes('[AI]') ? 'text-[#00ffc3] font-bold' : 'text-[#ff00ff]/80'}`}>{log}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {extractedFiles.length > 0 && (
          <div className="w-full lg:w-1/3 bg-[#0a0a0a] border border-[#ff00ff]/50 rounded-lg p-4 flex flex-col shadow-[0_0_15px_rgba(255,0,255,0.1)]">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b border-[#ff00ff]/30 pb-2">Scan Results</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {extractedFiles.map((file, idx) => (
                <div key={idx} className="bg-black border border-[#ff00ff]/20 p-3 rounded flex justify-between items-start hover:border-[#ff00ff]/50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm">{file.name}</span>
                    <span className="text-[10px] text-[#ff00ff]/60">{file.type} | {file.size}</span>
                  </div>
                  <button onClick={() => downloadFile(file)} className="bg-[#ff00ff]/20 hover:bg-[#ff00ff] hover:text-black text-[#ff00ff] w-8 h-8 rounded flex items-center justify-center transition-all" title="Download"><i className="fas fa-download"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScannerTool;
