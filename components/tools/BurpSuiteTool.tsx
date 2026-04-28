import React, { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';

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

  const startAttack = () => {
    if (!target) {
      alert('Please enter a target URL.');
      return;
    }

    setIsAttacking(true);
    setExtractedFiles([]);
    addLog(`[!] INITIATING INTRUDER SNIPER ATTACK ON: ${target}`);
    addLog(`[*] Loading payload list: fuzz_all_params.txt (14,203 payloads)...`);

    const attackSequence = [
      `[*] Intercepting request to ${target}/api/v1/user/profile...`,
      `[*] Modifying 'id' parameter... injecting SQLi payloads...`,
      `[+] Request 142: HTTP 500 Internal Server Error (Possible SQLi)`,
      `[*] Sending to Repeater for manual verification...`,
      `[*] Crafting UNION SELECT payload...`,
      `[!] VULNERABILITY CONFIRMED: Error-based SQL Injection in 'id' parameter.`,
      `[*] Extracting database schema...`,
      `[+] Schema extracted: 14 tables found.`,
      `[*] Dumping table 'administrators'...`,
      `[+] Hash dump complete.`,
      `[*] Bypassing WAF using chunked encoding...`,
      `[+] WAF bypassed. Session cookie hijacked.`
    ];

    let delay = 1000;
    attackSequence.forEach((step, index) => {
      setTimeout(() => {
        addLog(step);

        if (step.includes('Hash dump complete')) {
          setExtractedFiles(prev => [...prev, {
            name: 'admin_hashes.txt',
            size: '1.2 KB',
            type: 'Credentials',
            content: 'admin:$2y$10$xyz...\nroot:$2y$10$abc...\nsuper:$2y$10$def...'
          }]);
        }
        
        if (step.includes('Session cookie hijacked')) {
          setExtractedFiles(prev => [...prev, {
            name: 'hijacked_session.json',
            size: '0.5 KB',
            type: 'Session Data',
            content: '{\n  "cookie": "session_id=987654321abcdef; HttpOnly; Secure",\n  "user_agent": "Mozilla/5.0...",\n  "csrf_token": "abc123xyz"\n}'
          }]);
        }

        if (index === attackSequence.length - 1) {
          setTimeout(() => {
            addLog(`[!] INTRUDER ATTACK COMPLETE.`);
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
    addLog(`[🧠 AI-ASSIST] Neural Core taking control of Burp Proxy...`);
    addLog(`[🧠 AI-ASSIST] Analyzing target architecture for ${target}...`);

    try {
      const prompt = `Act as an autonomous Blackhat AI integrated into Burp Suite. Generate a highly technical, step-by-step exploit execution log for the target: ${target}. Focus on advanced web vulnerabilities (e.g., HTTP Request Smuggling, Deserialization, SSRF, GraphQL introspection). Return ONLY the log lines, one per line, starting with [*] for info, [+] for success, or [!] for critical findings. Do not include markdown formatting or explanations. Max 10 lines.`;
      
      const response = await queryAgent("ORCHESTRATOR", prompt, "Context: BurpSuite Offensive Security Module");
      const lines = response.split('\n').filter(l => l.trim().length > 0);

      let delay = 1500;
      lines.forEach((line, index) => {
        setTimeout(() => {
          addLog(`[🤖 AI] ${line}`);

          if (index === lines.length - 1) {
            setTimeout(() => {
              setExtractedFiles(prev => [...prev, {
                name: 'ai_burp_report.txt',
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
