import { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';
import { probeTarget, analyzeSecurityHeaders, testVulnerabilities, crawlTarget, bruteforceDirectories } from '../../services/realScanService';

interface ExtractedFile {
  name: string;
  size: string;
  content: string;
  type: string;
}

export default function OwaspTool() {
  const [target, setTarget] = useState('');
  const [isAttacking, setIsAttacking] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'OWASP_ZAP_V2.14.0 initialized.',
    'All scans perform REAL HTTP requests against the target.',
    'Awaiting target specification for Active Scan...'
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
      alert('Please enter a target URL.');
      return;
    }

    setIsAttacking(true);
    setExtractedFiles([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[!] INITIATING REAL OWASP ACTIVE SCAN ON: ${targetUrl}`);

    // A01: Broken Access Control — probe for exposed admin/sensitive paths
    addLog(`[*] A01:2021 — Scanning for Broken Access Control...`);
    const dirs = await bruteforceDirectories(targetUrl, (path, status) => {
      addLog(`[+] Accessible: ${path} (HTTP ${status})`);
    });
    addLog(`[+] ${dirs.length} accessible paths found (potential access control issues)`);

    if (dirs.length > 0) {
      setExtractedFiles(prev => [...prev, {
        name: 'access_control_findings.txt',
        size: `${dirs.length} entries`,
        type: 'A01: Broken Access Control',
        content: dirs.map(d => `${d.path} — HTTP ${d.status} (${d.size} bytes)`).join('\n'),
      }]);
    }

    // A02: Cryptographic Failures — check headers for HTTPS enforcement
    addLog(`[*] A02:2021 — Scanning for Cryptographic Failures...`);
    const headers = await analyzeSecurityHeaders(targetUrl);
    const hstsPresent = headers.headers.find(h => h.name === 'Strict-Transport-Security');
    if (hstsPresent?.status === 'critical') {
      addLog(`[!] HSTS not set — vulnerable to SSL stripping`);
    } else {
      addLog(`[+] HSTS configured correctly`);
    }
    addLog(`[+] Security Grade: ${headers.grade} (${headers.score}/100)`);
    headers.headers.filter(h => h.status === 'critical').forEach(h => {
      addLog(`[!] ${h.name}: ${h.description}`);
    });

    setExtractedFiles(prev => [...prev, {
      name: 'security_headers_owasp.json',
      size: `${JSON.stringify(headers, null, 2).length} bytes`,
      type: 'A02/A05: Headers & Crypto Analysis',
      content: JSON.stringify(headers, null, 2),
    }]);

    // A03: Injection — real SQLi, XSS, traversal payloads
    addLog(`[*] A03:2021 — Scanning for Injection vulnerabilities (SQLi, XSS, Path Traversal)...`);
    const vulns = await testVulnerabilities(targetUrl);
    const critical = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    vulns.forEach(v => {
      const prefix = v.severity === 'critical' ? '[!] CRITICAL' : v.severity === 'high' ? '[!] HIGH' : `[*] ${v.severity.toUpperCase()}`;
      addLog(`${prefix}: ${v.type} | param=${v.parameter} | ${v.indication}`);
    });

    setExtractedFiles(prev => [...prev, {
      name: 'injection_report.json',
      size: `${JSON.stringify(vulns, null, 2).length} bytes`,
      type: 'A03: Injection Findings',
      content: JSON.stringify(vulns, null, 2),
    }]);

    // A05: Security Misconfiguration — probe target
    addLog(`[*] A05:2021 — Scanning for Security Misconfiguration...`);
    const probe = await probeTarget(targetUrl);
    if (probe.server) addLog(`[!] Server header exposed: ${probe.server}`);
    if (probe.headers['x-powered-by']) addLog(`[!] X-Powered-By exposed: ${probe.headers['x-powered-by']}`);
    if (probe.technologies.length > 0) addLog(`[+] Technologies detected: ${probe.technologies.join(', ')}`);

    // A06: Vulnerable Components — check scripts
    addLog(`[*] A06:2021 — Scanning for Vulnerable and Outdated Components...`);
    const crawl = await crawlTarget(targetUrl);
    addLog(`[+] Spider: ${crawl.links.length} links, ${crawl.forms.length} forms, ${crawl.scripts.length} scripts`);
    crawl.scripts.forEach(s => {
      if (s.includes('jquery') && (s.includes('1.') || s.includes('2.'))) {
        addLog(`[!] Outdated jQuery detected: ${s}`);
      }
      if (s.includes('angular') && s.includes('1.')) {
        addLog(`[!] Outdated AngularJS detected: ${s}`);
      }
    });

    if (crawl.comments.length > 0) {
      addLog(`[!] A09: ${crawl.comments.length} HTML comments found (info disclosure)`);
    }

    crawl.forms.forEach(f => {
      addLog(`[+] Form: ${f.method.toUpperCase()} ${f.action} — inputs: ${f.inputs.join(', ')}`);
    });

    // Generate full OWASP report
    const fullReport = { headers, vulns, dirs, probe: { status: probe.status, server: probe.server, tech: probe.technologies }, crawl };
    setExtractedFiles(prev => [...prev, {
      name: 'owasp_full_report.json',
      size: `${JSON.stringify(fullReport, null, 2).length} bytes`,
      type: 'Full OWASP Scan Report',
      content: JSON.stringify(fullReport, null, 2),
    }]);

    addLog(`[!] OWASP ACTIVE SCAN COMPLETE. ${critical.length} critical/high, ${dirs.length} access issues, Grade: ${headers.grade}`);
    setIsAttacking(false);
  };

  const startAiAssist = async () => {
    if (!target) {
      alert('Please enter a target URL for the AI to analyze.');
      return;
    }

    setIsAiAssisting(true);
    setIsAttacking(true);
    setExtractedFiles([]);
    const targetUrl = target.startsWith('http') ? target : `https://${target}`;
    addLog(`[AI] Neural Core taking control of OWASP ZAP...`);
    addLog(`[AI] Running real OWASP scans on ${targetUrl} before AI analysis...`);

    // Real scans
    const probe = await probeTarget(targetUrl);
    addLog(`[+] Probe: HTTP ${probe.status} | Server: ${probe.server || 'hidden'} | Tech: ${probe.technologies.join(', ') || 'unknown'}`);

    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Security Grade: ${headers.grade} (${headers.score}/100)`);

    const vulns = await testVulnerabilities(targetUrl);
    const critVulns = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    addLog(`[+] Injection tests: ${critVulns.length} critical/high out of ${vulns.length}`);

    const crawl = await crawlTarget(targetUrl);
    addLog(`[+] Spider: ${crawl.links.length} links, ${crawl.forms.length} forms, ${crawl.scripts.length} scripts`);

    const dirs = await bruteforceDirectories(targetUrl);
    addLog(`[+] Access control: ${dirs.length} accessible paths`);

    // Feed real data to AI
    addLog(`[AI] Feeding real OWASP scan data to Quantum Intelligence...`);
    try {
      const realData = JSON.stringify({
        probe: { status: probe.status, server: probe.server, technologies: probe.technologies },
        securityHeaders: { grade: headers.grade, score: headers.score, critical: headers.headers.filter(h => h.status === 'critical').map(h => h.name) },
        vulnerabilities: vulns.map(v => ({ type: v.type, param: v.parameter, severity: v.severity, indication: v.indication })),
        crawl: { links: crawl.links.length, forms: crawl.forms, scripts: crawl.scripts, comments: crawl.comments.length },
        accessControl: dirs.map(d => ({ path: d.path, status: d.status })),
      });

      const prompt = `You are an OWASP security expert analyzing REAL scan results against ${targetUrl}. Here is the actual data:\n\n${realData}\n\nMap each finding to the OWASP Top 10 (2021). For each category, explain what was found, the risk level, exploitation method, and remediation. Reference the actual scan data. Format as a professional OWASP assessment report.`;
      
      const response = await queryAgent("ORCHESTRATOR", prompt, "Context: Real OWASP ZAP scan results analysis");
      response.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[AI] ${line}`));

      setExtractedFiles(prev => [...prev, {
        name: 'ai_owasp_report.txt',
        size: `${response.length} bytes`,
        type: 'AI OWASP Report (Real Data)',
        content: `Target: ${targetUrl}\nAI OWASP Top 10 Analysis:\n\n${response}`,
      }, {
        name: 'raw_owasp_data.json',
        size: `${realData.length} bytes`,
        type: 'Raw Scan Data',
        content: realData,
      }]);

      addLog(`[AI] Real-data OWASP analysis complete. Report generated.`);
    } catch (error) {
      addLog(`[!] AI Core connection failed. Raw scan data still available.`);
    }

    setIsAiAssisting(false);
    setIsAttacking(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#3b82f6] font-mono p-4">
      <div className="border-b border-[#3b82f6]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#3b82f6]">OWASP ZAP SCANNER</h1>
          <p className="text-xs text-[#3b82f6]/60 uppercase tracking-[0.3em]">Top 10 Vulnerability Assessment</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#3b82f6]/80">Status: {isAttacking ? (isAiAssisting ? 'AI-AUTOPILOT' : 'SCANNING') : 'STANDBY'}</div>
          <div className="text-[10px] text-[#3b82f6]/50">Mode: Aggressive | Threads: 10</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target URL (e.g., https://example.com)..."
          className="flex-1 bg-black border border-[#3b82f6]/50 rounded p-3 text-[#3b82f6] outline-none focus:border-[#3b82f6] focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all"
          disabled={isAttacking}
          onKeyDown={e => e.key === 'Enter' && !isAttacking && startAttack()}
        />
        <button
          onClick={startAttack}
          disabled={isAttacking}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isAttacking 
              ? 'bg-[#3b82f6]/20 text-[#3b82f6]/50 cursor-not-allowed border border-[#3b82f6]/20' 
              : 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6] hover:bg-[#3b82f6] hover:text-black hover:shadow-[0_0_15px_#3b82f6]'
          }`}
        >
          <i className="fas fa-radar mr-2"></i> Active Scan
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
        <div className="flex-1 bg-black border border-[#3b82f6]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <div className="space-y-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[!]') ? 'text-white font-bold bg-red-600/20 px-1 inline-block' : log.includes('[+]') ? 'text-emerald-500' : log.includes('[🧠') || log.includes('[🤖') ? 'text-[#00ffc3] font-bold' : 'text-[#3b82f6]/80'}`}>
                {log}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {extractedFiles.length > 0 && (
          <div className="w-full lg:w-1/3 bg-[#0a0a0a] border border-[#3b82f6]/50 rounded-lg p-4 flex flex-col shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b border-[#3b82f6]/30 pb-2">Scan Results</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {extractedFiles.map((file, idx) => (
                <div key={idx} className="bg-black border border-[#3b82f6]/20 p-3 rounded flex flex-col gap-2 hover:border-[#3b82f6]/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{file.name}</span>
                      <span className="text-[10px] text-[#3b82f6]/60">Type: {file.type}</span>
                      <span className="text-[10px] text-[#3b82f6]/60">Size: {file.size}</span>
                    </div>
                    <button 
                      onClick={() => downloadFile(file)}
                      className="bg-[#3b82f6]/20 hover:bg-[#3b82f6] hover:text-black text-[#3b82f6] w-8 h-8 rounded flex items-center justify-center transition-all"
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
