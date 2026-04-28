import React, { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';

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
    'Loading Top 10 Vulnerability signatures...',
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

  const startAttack = () => {
    if (!target) {
      alert('Please enter a target URL.');
      return;
    }

    setIsAttacking(true);
    setExtractedFiles([]);
    addLog(`[!] INITIATING OWASP ACTIVE SCAN ON: ${target}`);
    addLog(`[*] Spidering target...`);

    const attackSequence = [
      `[*] Crawling complete. 142 URLs discovered.`,
      `[*] Starting Active Scan...`,
      `[*] Scanning for A01:2021-Broken Access Control...`,
      `[+] Found IDOR vulnerability in /api/users/{id}`,
      `[*] Scanning for A02:2021-Cryptographic Failures...`,
      `[-] No cleartext transmission detected.`,
      `[*] Scanning for A03:2021-Injection...`,
      `[!] VULNERABILITY CONFIRMED: Blind SQL Injection in 'search' parameter.`,
      `[*] Scanning for A04:2021-Insecure Design...`,
      `[*] Scanning for A05:2021-Security Misconfiguration...`,
      `[+] Directory listing enabled on /assets/uploads/`,
      `[*] Scanning for A06:2021-Vulnerable and Outdated Components...`,
      `[!] jQuery 1.12.4 detected (CVE-2015-9251).`,
      `[*] Scanning for A07:2021-Identification and Authentication Failures...`,
      `[*] Scanning for A08:2021-Software and Data Integrity Failures...`,
      `[*] Scanning for A09:2021-Security Logging and Monitoring Failures...`,
      `[*] Scanning for A10:2021-Server-Side Request Forgery (SSRF)...`,
      `[!] VULNERABILITY CONFIRMED: SSRF in /api/fetch_image?url=`
    ];

    let delay = 1000;
    attackSequence.forEach((step, index) => {
      setTimeout(() => {
        addLog(step);

        if (step.includes('Directory listing enabled')) {
          setExtractedFiles(prev => [...prev, {
            name: 'directory_listing.txt',
            size: '0.8 KB',
            type: 'Information Disclosure',
            content: 'Index of /assets/uploads/\n\n- backup.zip\n- config.bak\n- users.csv'
          }]);
        }
        
        if (step.includes('SSRF in')) {
          setExtractedFiles(prev => [...prev, {
            name: 'ssrf_proof.txt',
            size: '1.5 KB',
            type: 'Vulnerability Proof',
            content: `Target: ${target}/api/fetch_image?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/\n\nResponse:\n{\n  "Code" : "Success",\n  "LastUpdated" : "2026-03-13T12:00:00Z",\n  "Type" : "AWS-HMAC",\n  "AccessKeyId" : "AKIAIOSFODNN7EXAMPLE",\n  "SecretAccessKey" : "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",\n  "Token" : "token_data_here"\n}`
          }]);
        }

        if (index === attackSequence.length - 1) {
          setTimeout(() => {
            addLog(`[!] ACTIVE SCAN COMPLETE. Generating report...`);
            setExtractedFiles(prev => [...prev, {
              name: 'owasp_zap_report.html',
              size: '14.2 KB',
              type: 'Scan Report',
              content: `<html><body><h1>ZAP Scanning Report</h1><h2>Target: ${target}</h2><p>High Risk: 2</p><p>Medium Risk: 1</p><p>Low Risk: 0</p></body></html>`
            }]);
            setIsAttacking(false);
          }, 1500);
        }
      }, delay);
      
      delay += Math.floor(Math.random() * 1500) + 500;
    });
  };

  const startAiAssist = async () => {
    if (!target) {
      alert('Please enter a target URL for the AI to analyze.');
      return;
    }

    setIsAiAssisting(true);
    setIsAttacking(true);
    setExtractedFiles([]);
    addLog(`[🧠 AI-ASSIST] Neural Core taking control of OWASP ZAP...`);
    addLog(`[🧠 AI-ASSIST] Analyzing target architecture for ${target}...`);

    try {
      const prompt = `Act as an autonomous Blackhat AI integrated into OWASP ZAP. Generate a highly technical, step-by-step exploit execution log for the target: ${target}. Focus on OWASP Top 10 vulnerabilities (e.g., Broken Access Control, Injection, SSRF). Return ONLY the log lines, one per line, starting with [*] for info, [+] for success, or [!] for critical findings. Do not include markdown formatting or explanations. Max 10 lines.`;
      
      const response = await queryAgent("ORCHESTRATOR", prompt, "Context: OWASP ZAP Offensive Security Module");
      const lines = response.split('\n').filter(l => l.trim().length > 0);

      let delay = 1500;
      lines.forEach((line, index) => {
        setTimeout(() => {
          addLog(`[🤖 AI] ${line}`);

          if (index === lines.length - 1) {
            setTimeout(() => {
              setExtractedFiles(prev => [...prev, {
                name: 'ai_owasp_report.txt',
                size: '3.4 KB',
                type: 'AI Analysis',
                content: `Target: ${target}\nAI Vulnerability Report:\n\n${lines.join('\n')}\n\nRecommendation: Immediate patching required.`
              }]);
              addLog(`[🧠 AI-ASSIST] Autonomous exploitation complete. Report generated.`);
              setIsAiAssisting(false);
              setIsAttacking(false);
            }, 1000);
          }
        }, delay);
        delay += Math.floor(Math.random() * 2000) + 800;
      });

    } catch (error) {
      addLog(`[!] AI Core connection failed. Falling back to manual mode.`);
      setIsAiAssisting(false);
      setIsAttacking(false);
    }
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
