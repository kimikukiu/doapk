import { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';
import { probeTarget, analyzeSecurityHeaders, probePorts, testVulnerabilities, bruteforceDirectories, crawlTarget, dnsLookup } from '../../services/realScanService';

interface ExtractedFile {
  name: string;
  size: string;
  content: string;
  type: string;
}

export default function BlackhatTool() {
  const [target, setTarget] = useState('');
  const [isAttacking, setIsAttacking] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'BLACKHAT_CORE_V9.0 initialized.',
    'All scans perform REAL network requests.',
    'Awaiting target specification...'
  ]);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
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

  const startAttack = async () => {
    if (!target) {
      alert('Please enter a target IP or domain.');
      return;
    }

    setIsAttacking(true);
    setExtractedFiles([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[!] INITIATING REAL BLACKHAT RECON ON: ${target}`);

    // Phase 1: DNS
    addLog(`[*] Phase 1: DNS reconnaissance...`);
    const dns = await dnsLookup(target);
    addLog(`[+] Resolved IP: ${dns.ip}`);
    Object.entries(dns.records).forEach(([type, records]) => {
      if (records.length > 0) addLog(`[+] ${type} records: ${records.join(', ')}`);
    });

    // Phase 2: Probe
    addLog(`[*] Phase 2: HTTP fingerprinting...`);
    const probe = await probeTarget(targetUrl);
    if (probe.error) {
      addLog(`[!] Probe error: ${probe.error}`);
    } else {
      addLog(`[+] HTTP ${probe.status} ${probe.statusText} (${probe.responseTime}ms)`);
      addLog(`[+] Server: ${probe.server || 'Hidden'}`);
      if (probe.technologies.length > 0) addLog(`[+] Stack: ${probe.technologies.join(', ')}`);
    }

    // Phase 3: Port scan
    addLog(`[*] Phase 3: Port scanning (18 common ports)...`);
    const ports = await probePorts(target);
    const openPorts = ports.filter(p => p.status === 'open');
    const filteredPorts = ports.filter(p => p.status === 'filtered');
    openPorts.forEach(p => addLog(`[+] PORT ${p.port} OPEN — ${p.service} (${p.responseTime}ms)`));
    if (filteredPorts.length > 0) addLog(`[*] Filtered ports: ${filteredPorts.map(p => p.port).join(', ')}`);
    addLog(`[+] Summary: ${openPorts.length} open, ${filteredPorts.length} filtered, ${ports.length - openPorts.length - filteredPorts.length} closed`);

    setExtractedFiles(prev => [...prev, {
      name: 'port_scan.json',
      size: `${JSON.stringify(ports, null, 2).length} bytes`,
      type: 'Port Scan Results',
      content: JSON.stringify(ports, null, 2),
    }]);

    // Phase 4: Security headers
    addLog(`[*] Phase 4: Security header analysis...`);
    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Security Grade: ${headers.grade} (${headers.score}/100)`);
    headers.headers.filter(h => h.status === 'critical').forEach(h => {
      addLog(`[!] VULN: ${h.name} — ${h.description}`);
    });

    // Phase 5: Directory enumeration
    addLog(`[*] Phase 5: Directory/file bruteforce...`);
    const dirs = await bruteforceDirectories(targetUrl, (path, status) => {
      addLog(`[+] FOUND: ${path} (HTTP ${status})`);
    });

    if (dirs.length > 0) {
      setExtractedFiles(prev => [...prev, {
        name: 'directory_enum.txt',
        size: `${dirs.length} entries`,
        type: 'Directory Enumeration',
        content: dirs.map(d => `${d.path} — HTTP ${d.status} (${d.size} bytes)`).join('\n'),
      }]);
    }

    // Phase 6: Vulnerability injection
    addLog(`[*] Phase 6: Injecting real exploit payloads (SQLi, XSS, Traversal)...`);
    const vulns = await testVulnerabilities(targetUrl);
    const critical = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    vulns.forEach(v => {
      const tag = v.severity === 'critical' ? '[!] CRITICAL' : v.severity === 'high' ? '[!] HIGH' : `[*] ${v.severity.toUpperCase()}`;
      addLog(`${tag}: ${v.type} | ${v.parameter} | ${v.indication}`);
    });

    setExtractedFiles(prev => [...prev, {
      name: 'vulnerability_report.json',
      size: `${JSON.stringify(vulns, null, 2).length} bytes`,
      type: 'Vulnerability Scan',
      content: JSON.stringify(vulns, null, 2),
    }]);

    // Phase 7: Crawl for attack surface
    addLog(`[*] Phase 7: Crawling attack surface...`);
    const crawl = await crawlTarget(targetUrl);
    addLog(`[+] Links: ${crawl.links.length} | Forms: ${crawl.forms.length} | Scripts: ${crawl.scripts.length} | Comments: ${crawl.comments.length}`);

    // Full recon report
    const fullReport = { dns, probe, ports, headers, dirs, vulns, crawl };
    setExtractedFiles(prev => [...prev, {
      name: 'full_recon_report.json',
      size: `${JSON.stringify(fullReport, null, 2).length} bytes`,
      type: 'Full Recon Report',
      content: JSON.stringify(fullReport, null, 2),
    }]);

    addLog(`[!] BLACKHAT RECON COMPLETE. ${critical.length} critical/high vulns, ${openPorts.length} open ports, ${dirs.length} exposed paths.`);
    setIsAttacking(false);
  };

  const startDeface = async () => {
    if (!target) {
      alert('Please enter a target IP or domain.');
      return;
    }

    setIsAttacking(true);
    setExtractedFiles([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[!] INITIATING REAL DEFACE RECON ON: ${target}`);

    // Real recon for deface: find upload forms, writable dirs, CMS info
    addLog(`[*] Crawling for file upload forms and writable endpoints...`);
    const crawl = await crawlTarget(targetUrl);
    const uploadForms = crawl.forms.filter(f => 
      f.inputs.some(i => i.toLowerCase().includes('file') || i.toLowerCase().includes('upload'))
    );
    addLog(`[+] Forms with file inputs: ${uploadForms.length}`);
    uploadForms.forEach(f => addLog(`[+] Upload form: ${f.method.toUpperCase()} ${f.action} — fields: ${f.inputs.join(', ')}`));

    addLog(`[*] Checking writable directories...`);
    const writablePaths = ['/uploads/', '/upload/', '/images/', '/files/', '/media/', '/wp-content/uploads/', '/assets/uploads/'];
    for (const path of writablePaths) {
      try {
        await fetch(`${targetUrl}${path}`, { method: 'HEAD', mode: 'no-cors' });
        addLog(`[+] ${path} — accessible`);
      } catch {
        addLog(`[-] ${path} — not accessible`);
      }
    }

    const probe = await probeTarget(targetUrl);
    const isCms = probe.technologies.some(t => t.includes('WordPress') || t.includes('Joomla') || t.includes('Drupal'));
    if (isCms) addLog(`[!] CMS DETECTED: ${probe.technologies.filter(t => t.includes('WordPress') || t.includes('Joomla') || t.includes('Drupal')).join(', ')}`);

    // Generate deface payload
    const defacePayload = `<html>\n<head><title>DEFACED</title></head>\n<body style="background:#000;color:#0f0;text-align:center;font-family:monospace;padding-top:20vh;">\n<h1 style="font-size:4em;">HACKED BY WHOAMISEC</h1>\n<p>Security is an illusion. We are the swarm.</p>\n<p>Target: ${target} | Date: ${new Date().toISOString()}</p>\n</body>\n</html>`;

    setExtractedFiles(prev => [...prev, {
      name: 'deface_payload.html',
      size: `${defacePayload.length} bytes`,
      type: 'Deface Payload',
      content: defacePayload,
    }]);

    addLog(`[+] Deface payload generated. Upload via discovered form or writable directory.`);
    addLog(`[!] DEFACE RECON COMPLETE.`);
    setIsAttacking(false);
  };

  const startAiAssist = async () => {
    if (!target) {
      alert('Please enter a target for AI analysis.');
      return;
    }

    setIsAiAssisting(true);
    setIsAttacking(true);
    setExtractedFiles([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[AI] Taking control of Blackhat Framework...`);
    addLog(`[AI] Running real recon before AI analysis...`);

    // Real recon
    const dns = await dnsLookup(target);
    addLog(`[+] DNS: ${dns.ip} | ${Object.entries(dns.records).filter(([,v]) => v.length > 0).map(([k,v]) => `${k}:${v.length}`).join(', ')}`);

    const probe = await probeTarget(targetUrl);
    addLog(`[+] HTTP ${probe.status} | Server: ${probe.server || 'hidden'} | Tech: ${probe.technologies.join(', ') || 'unknown'}`);

    const ports = await probePorts(target);
    const openPorts = ports.filter(p => p.status === 'open');
    addLog(`[+] Ports: ${openPorts.length} open — ${openPorts.map(p => `${p.port}/${p.service}`).join(', ')}`);

    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Security: ${headers.grade} (${headers.score}/100)`);

    const vulns = await testVulnerabilities(targetUrl);
    const critVulns = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    addLog(`[+] Vulns: ${critVulns.length} critical/high out of ${vulns.length} tests`);

    addLog(`[AI] Feeding real recon data to Quantum Intelligence...`);
    try {
      const realData = JSON.stringify({
        dns, probe: { status: probe.status, server: probe.server, technologies: probe.technologies },
        openPorts: openPorts.map(p => ({ port: p.port, service: p.service })),
        securityGrade: { grade: headers.grade, score: headers.score, missing: headers.headers.filter(h => h.status === 'critical').map(h => h.name) },
        vulnerabilities: vulns.map(v => ({ type: v.type, param: v.parameter, severity: v.severity, indication: v.indication })),
      });

      const prompt = `You are an elite blackhat penetration tester. Analyze these REAL reconnaissance results against ${target}:\n\n${realData}\n\nProvide an exploitation plan: which vulnerabilities to chain, attack vectors based on open ports and detected tech stack, and steps to achieve full compromise. Reference the actual scan data. Be specific and technical.`;
      
      const response = await queryAgent("ORCHESTRATOR", prompt, "Context: Real blackhat recon data analysis");
      response.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[AI] ${line}`));

      setExtractedFiles(prev => [...prev, {
        name: 'ai_exploit_plan.txt',
        size: `${response.length} bytes`,
        type: 'AI Exploitation Plan (Real Data)',
        content: `Target: ${target}\n\n${response}`,
      }, {
        name: 'raw_recon_data.json',
        size: `${realData.length} bytes`,
        type: 'Raw Recon Data',
        content: realData,
      }]);

      addLog(`[AI] Real-data analysis complete.`);
    } catch (error) {
      addLog(`[!] AI Core failed. Raw scan data still available.`);
    }

    setIsAiAssisting(false);
    setIsAttacking(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#ef4444] font-mono p-4">
      <div className="border-b border-[#ef4444]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#ef4444]">BLACKHAT EXPLOIT FRAMEWORK</h1>
          <p className="text-xs text-[#ef4444]/60 uppercase tracking-[0.3em]">Offensive Security & Zero-Day Deployment</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#ef4444]/80">Status: {isAttacking ? (isAiAssisting ? 'AI-AUTOPILOT' : 'ENGAGED') : 'STANDBY'}</div>
          <div className="text-[10px] text-[#ef4444]/50">Anonymity: TOR + VPN | Proxy: ACTIVE</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target IP or domain (e.g., 192.168.1.100)..."
          className="flex-1 bg-black border border-[#ef4444]/50 rounded p-3 text-[#ef4444] outline-none focus:border-[#ef4444] focus:shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-all"
          disabled={isAttacking}
          onKeyDown={e => e.key === 'Enter' && !isAttacking && startAttack()}
        />
        <button
          onClick={startAttack}
          disabled={isAttacking}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isAttacking 
              ? 'bg-[#ef4444]/20 text-[#ef4444]/50 cursor-not-allowed border border-[#ef4444]/20' 
              : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444] hover:bg-[#ef4444] hover:text-black hover:shadow-[0_0_15px_#ef4444]'
          }`}
        >
          <i className="fas fa-skull mr-2"></i> Launch Exploit
        </button>
        <button
          onClick={startDeface}
          disabled={isAttacking}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isAttacking 
              ? 'bg-[#ef4444]/20 text-[#ef4444]/50 cursor-not-allowed border border-[#ef4444]/20' 
              : 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444] hover:bg-[#ef4444] hover:text-black hover:shadow-[0_0_15px_#ef4444]'
          }`}
        >
          <i className="fas fa-paint-roller mr-2"></i> Auto-Deface
        </button>
        <button
          onClick={startAiAssist}
          disabled={isAttacking}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isAttacking 
              ? 'bg-[#00ffc3]/20 text-[#00ffc3]/50 cursor-not-allowed border border-[#00ffc3]/20' 
              : 'bg-[#00ffc3]/10 text-[#00ffc3] border border-[#00ffc3] hover:bg-[#00ffc3] hover:text-black hover:shadow-[0_0_15px_#00ffc3]'
          }`}
        >
          <i className="fas fa-brain mr-2"></i> AI Auto-Pilot
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-black border border-[#ef4444]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <div className="space-y-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[!]') ? 'text-white font-bold bg-red-600/20 px-1 inline-block' : log.includes('[+]') ? 'text-emerald-500' : 'text-[#ef4444]/80'}`}>
                {log}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {extractedFiles.length > 0 && (
          <div className="w-full lg:w-1/3 bg-[#0a0a0a] border border-[#ef4444]/50 rounded-lg p-4 flex flex-col shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b border-[#ef4444]/30 pb-2">Exfiltrated Data</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {extractedFiles.map((file, idx) => (
                <div key={idx} className="bg-black border border-[#ef4444]/20 p-3 rounded flex flex-col gap-2 hover:border-[#ef4444]/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{file.name}</span>
                      <span className="text-[10px] text-[#ef4444]/60">Type: {file.type}</span>
                      <span className="text-[10px] text-[#ef4444]/60">Size: {file.size}</span>
                    </div>
                    <button 
                      onClick={() => downloadFile(file)}
                      className="bg-[#ef4444]/20 hover:bg-[#ef4444] hover:text-black text-[#ef4444] w-8 h-8 rounded flex items-center justify-center transition-all"
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
