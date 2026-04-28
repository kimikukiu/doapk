import { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';
import { probeTarget, analyzeSecurityHeaders, testVulnerabilities, crawlTarget, bruteforceDirectories } from '../../services/realScanService';

interface ExtractedFile {
  name: string;
  size: string;
  content: string;
  type: string;
}

export default function BurpSuiteTool() {
  const [target, setTarget] = useState('');
  const [isAttacking, setIsAttacking] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'BURP_PROXY_PRO_V2026.1 initialized.',
    'Proxy listener active on 127.0.0.1:8080',
    'Awaiting target specification for Intruder/Repeater...'
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
    addLog(`[!] INITIATING REAL INTRUDER SCAN ON: ${targetUrl}`);

    // Phase 1: Probe
    addLog(`[*] Phase 1: Probing target...`);
    const probe = await probeTarget(targetUrl);
    if (probe.error) {
      addLog(`[!] Connection error: ${probe.error}`);
    } else {
      addLog(`[+] HTTP ${probe.status} ${probe.statusText} (${probe.responseTime}ms)`);
      addLog(`[+] Server: ${probe.server || 'Hidden'} | Content-Type: ${probe.contentType}`);
      if (probe.technologies.length > 0) {
        addLog(`[+] Technologies detected: ${probe.technologies.join(', ')}`);
      }
    }

    // Phase 2: Security Headers
    addLog(`[*] Phase 2: Analyzing security headers...`);
    const headers = await analyzeSecurityHeaders(targetUrl);
    const criticalHeaders = headers.headers.filter(h => h.status === 'critical');
    const secureHeaders = headers.headers.filter(h => h.status === 'secure');
    addLog(`[+] Security score: ${headers.score}/100 (Grade: ${headers.grade})`);
    addLog(`[+] Secure headers: ${secureHeaders.length}/${headers.headers.length}`);
    criticalHeaders.forEach(h => {
      addLog(`[!] MISSING: ${h.name} — ${h.description}`);
    });

    setExtractedFiles(prev => [...prev, {
      name: 'security_headers_report.json',
      size: `${JSON.stringify(headers, null, 2).length} bytes`,
      type: 'Header Analysis',
      content: JSON.stringify(headers, null, 2),
    }]);

    // Phase 3: Crawl
    addLog(`[*] Phase 3: Crawling target for attack surface...`);
    const crawl = await crawlTarget(targetUrl);
    addLog(`[+] Links discovered: ${crawl.links.length}`);
    addLog(`[+] Forms found: ${crawl.forms.length}`);
    addLog(`[+] Scripts loaded: ${crawl.scripts.length}`);
    if (crawl.comments.length > 0) {
      addLog(`[!] HTML comments found: ${crawl.comments.length} (potential info leak)`);
    }
    crawl.forms.forEach(f => {
      addLog(`[+] Form: ${f.method.toUpperCase()} ${f.action} — params: ${f.inputs.join(', ')}`);
    });

    // Phase 4: Directory bruteforce
    addLog(`[*] Phase 4: Directory bruteforce (35 paths)...`);
    const dirs = await bruteforceDirectories(targetUrl, (path, status) => {
      addLog(`[+] FOUND: ${path} (HTTP ${status})`);
    });
    addLog(`[+] Accessible paths: ${dirs.length}/35`);
    
    if (dirs.length > 0) {
      setExtractedFiles(prev => [...prev, {
        name: 'directory_enum.txt',
        size: `${dirs.length} entries`,
        type: 'Directory Enumeration',
        content: dirs.map(d => `${d.path} — HTTP ${d.status} (${d.size} bytes)`).join('\n'),
      }]);
    }

    // Phase 5: Vulnerability testing
    addLog(`[*] Phase 5: Injecting real payloads (SQLi, XSS, Path Traversal)...`);
    const vulns = await testVulnerabilities(targetUrl);
    const criticalVulns = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    vulns.forEach(v => {
      const prefix = v.severity === 'critical' ? '[!]' : v.severity === 'high' ? '[!]' : v.severity === 'medium' ? '[+]' : '[*]';
      addLog(`${prefix} ${v.type} | param=${v.parameter} | ${v.indication} (${v.responseTime}ms)`);
    });

    setExtractedFiles(prev => [...prev, {
      name: 'vulnerability_report.json',
      size: `${JSON.stringify(vulns, null, 2).length} bytes`,
      type: 'Vulnerability Scan',
      content: JSON.stringify(vulns, null, 2),
    }]);

    addLog(`[!] INTRUDER SCAN COMPLETE. ${criticalVulns.length} critical/high findings.`);
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
    addLog(`[AI] Neural Core taking control of Burp Proxy...`);
    addLog(`[AI] Running real recon on ${targetUrl} before AI analysis...`);

    // Run real scans first
    const probe = await probeTarget(targetUrl);
    addLog(`[+] Probe: HTTP ${probe.status} | Server: ${probe.server || 'hidden'} | Tech: ${probe.technologies.join(', ') || 'unknown'}`);

    const headers = await analyzeSecurityHeaders(targetUrl);
    addLog(`[+] Security Grade: ${headers.grade} (${headers.score}/100)`);

    const crawl = await crawlTarget(targetUrl);
    addLog(`[+] Crawl: ${crawl.links.length} links, ${crawl.forms.length} forms, ${crawl.scripts.length} scripts`);

    const vulns = await testVulnerabilities(targetUrl);
    const critVulns = vulns.filter(v => v.severity === 'critical' || v.severity === 'high');
    addLog(`[+] Vuln scan: ${critVulns.length} critical/high out of ${vulns.length} tests`);

    // Feed real data to AI
    addLog(`[AI] Feeding real scan data to Quantum Intelligence for deep analysis...`);
    try {
      const realData = JSON.stringify({
        probe: { status: probe.status, server: probe.server, technologies: probe.technologies, headers: probe.headers },
        securityHeaders: { grade: headers.grade, score: headers.score, critical: headers.headers.filter(h => h.status === 'critical').map(h => h.name) },
        crawl: { links: crawl.links.length, forms: crawl.forms, scripts: crawl.scripts.length, comments: crawl.comments },
        vulnerabilities: vulns.map(v => ({ type: v.type, param: v.parameter, severity: v.severity, indication: v.indication })),
      });

      const prompt = `You are an expert penetration tester analyzing REAL scan results from Burp Suite against ${targetUrl}. Here is the actual scan data:\n\n${realData}\n\nProvide a professional penetration test analysis. For each finding, explain the risk, how to exploit it, and remediation. Focus on the most critical issues first. Be specific and reference the actual data. Format as a professional pentest report.`;
      
      const response = await queryAgent("ORCHESTRATOR", prompt, "Context: Real Burp Suite scan results analysis");
      const lines = response.split('\n').filter((l: string) => l.trim().length > 0);

      lines.forEach((line: string) => {
        addLog(`[AI] ${line}`);
      });

      setExtractedFiles(prev => [...prev, {
        name: 'ai_pentest_report.txt',
        size: `${response.length} bytes`,
        type: 'AI Pentest Report (Real Data)',
        content: `Target: ${targetUrl}\nAI Analysis of Real Scan Data:\n\n${response}`,
      }, {
        name: 'raw_scan_data.json',
        size: `${realData.length} bytes`,
        type: 'Raw Scan Data',
        content: realData,
      }]);

      addLog(`[AI] Real-data analysis complete. Report generated.`);
    } catch (error) {
      addLog(`[!] AI Core connection failed. Raw scan data still available.`);
    }

    setIsAiAssisting(false);
    setIsAttacking(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#ff6600] font-mono p-4">
      <div className="border-b border-[#ff6600]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#ff6600]">BURP SUITE PROXY</h1>
          <p className="text-xs text-[#ff6600]/60 uppercase tracking-[0.3em]">Web Application Security Testing</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#ff6600]/80">Status: {isAttacking ? (isAiAssisting ? 'AI-AUTOPILOT' : 'ENGAGED') : 'STANDBY'}</div>
          <div className="text-[10px] text-[#ff6600]/50">Interceptor: ON | Scope: {target || 'ANY'}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target URL (e.g., https://example.com)..."
          className="flex-1 bg-black border border-[#ff6600]/50 rounded p-3 text-[#ff6600] outline-none focus:border-[#ff6600] focus:shadow-[0_0_10px_rgba(255,102,0,0.2)] transition-all"
          disabled={isAttacking}
          onKeyDown={e => e.key === 'Enter' && !isAttacking && startAttack()}
        />
        <button
          onClick={startAttack}
          disabled={isAttacking}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isAttacking 
              ? 'bg-[#ff6600]/20 text-[#ff6600]/50 cursor-not-allowed border border-[#ff6600]/20' 
              : 'bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600] hover:bg-[#ff6600] hover:text-black hover:shadow-[0_0_15px_#ff6600]'
          }`}
        >
          <i className="fas fa-spider mr-2"></i> Intruder
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
        <div className="flex-1 bg-black border border-[#ff6600]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <div className="space-y-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[!]') ? 'text-white font-bold bg-red-600/20 px-1 inline-block' : log.includes('[+]') ? 'text-emerald-500' : log.includes('[🧠') || log.includes('[🤖') ? 'text-[#00ffc3] font-bold' : 'text-[#ff6600]/80'}`}>
                {log}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {extractedFiles.length > 0 && (
          <div className="w-full lg:w-1/3 bg-[#0a0a0a] border border-[#ff6600]/50 rounded-lg p-4 flex flex-col shadow-[0_0_15px_rgba(255,102,0,0.1)]">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b border-[#ff6600]/30 pb-2">Intercepted Loot</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {extractedFiles.map((file, idx) => (
                <div key={idx} className="bg-black border border-[#ff6600]/20 p-3 rounded flex flex-col gap-2 hover:border-[#ff6600]/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{file.name}</span>
                      <span className="text-[10px] text-[#ff6600]/60">Type: {file.type}</span>
                      <span className="text-[10px] text-[#ff6600]/60">Size: {file.size}</span>
                    </div>
                    <button 
                      onClick={() => downloadFile(file)}
                      className="bg-[#ff6600]/20 hover:bg-[#ff6600] hover:text-black text-[#ff6600] w-8 h-8 rounded flex items-center justify-center transition-all"
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
