import { useState, useRef, useEffect } from 'react';
import { AITaskQueue } from '../services/aiTaskQueue';

export default function QuantumIntelligenceUltra() {
  const [activeTab, setActiveTab] = useState('orchestrator');
  const [input, setInput] = useState('');
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Dashboard online',
    '6 tools registered',
    'Waiting for commands'
  ]);
  const [taskResult, setTaskResult] = useState<string>('');
  const taskQueue = useRef(new AITaskQueue(process.env.GEMINI_API_KEY || ""));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [systemLogs]);

  const logSystem = (message: string) => {
    setSystemLogs(prev => [...prev, message]);
  };

  const launchTool = (taskOverride?: string) => {
    const task = (taskOverride || input).toLowerCase().trim();
    
    if (!task) {
      alert('Enter a command');
      return;
    }
    
    if (task.startsWith('ask ')) {
      const question = task.substring(4);
      logSystem(`Asking AI: ${question}`);
      taskQueue.current.executeTask("QuantumIntelligenceUltra", question).then(res => {
        setTaskResult(res);
        logSystem('AI Analysis complete');
      });
    }
    else if (task.includes('gpt') || task.includes('chat') || task.includes('ask')) {
      window.open('/gpt-tool', '_blank');
      logSystem('Launching GPT tool');
    }
    else if (task.includes('ide') || task.includes('code') || task.includes('compile')) {
      window.open('/ide-tool', '_blank');
      logSystem('Launching IDE tool');
    }
    else if (task.includes('solana') || task.includes('chain') || task.includes('blockchain')) {
      window.open('/solana-tool', '_blank');
      logSystem('Launching Solana tool');
    }
    else if (task.includes('deploy') || task.includes('contract') || task.includes('zero-time')) {
      window.open('/deployer-tool', '_blank');
      logSystem('Launching Deployer tool');
    }
    else if (task.includes('quantum') || task.includes('qbit')) {
      window.open('/quantum-tool', '_blank');
      logSystem('Launching Quantum tool');
    }
    else if (task.includes('scan') || task.includes('network') || task.includes('port')) {
      window.open('/scanner-tool', '_blank');
      logSystem('Launching Scanner tool');
    }
    else if (task.includes('s3') || task.includes('bucket') || task.includes('aws')) {
      window.open('/s3-tool', '_blank');
      logSystem('Launching S3 Buckets tool');
    }
    else if (task.includes('blackhat') || task.includes('exploit') || task.includes('ninja')) {
      window.open('/blackhat-tool', '_blank');
      logSystem('Launching Blackhat tool');
    }
    else if (task.includes('burp') || task.includes('proxy') || task.includes('intruder')) {
      window.open('/burpsuite-tool', '_blank');
      logSystem('Launching BurpSuite tool');
    }
    else if (task.includes('owasp') || task.includes('zap') || task.includes('active scan')) {
      window.open('/owasp-tool', '_blank');
      logSystem('Launching OWASP ZAP tool');
    }
    else {
      alert('Specify which tool: gpt, ide, solana, deployer, quantum, scanner, s3, blackhat, burp, owasp');
    }
    
    if (!taskOverride) setInput('');
  };

  const tabContents: Record<string, any> = {
    orchestrator: (
      <div className="space-y-3">
        <p className="text-[#ffaa00] drop-shadow-[0_0_5px_#ffaa00]">ORCHESTRATOR<br />Ce se pregateste iar de sunt spitale pline cu pacienti, cauta in modul stealth</p>
        <div className="text-[#00ffc3] pl-4 border-l-2 border-[#00ffc3] py-2 italic">
          Sunt ORCHESTRATOR, centrul de comandă al Singularity Core. Am activat modulele de scanare cuantică și am infiltrat rețelele de date globale în regim stealth.
        </div>
        {taskResult && (
          <div className="mt-4 p-4 bg-black/50 border border-[#00ffc3] rounded text-[#00ffc3]">
            <p className="font-bold uppercase text-[0.8rem]">AI Analysis Result:</p>
            <p className="whitespace-pre-wrap">{taskResult}</p>
          </div>
        )}
      </div>
    ),
    researcher: (
      <div className="text-[#ffaa00] space-y-2">
        <p>→ [RESEARCHER] Deep-diving into knowledge base...</p>
        <p>→ [SOLANA] Verifying on-chain integrity...</p>
        <p>→ [DEPLOYER] Initiating zero-time deployment check...</p>
        <p className="mt-4 text-[#00ffc3]/60">Use tool buttons to access real tools.</p>
      </div>
    ),
    coder: (
      <div className="text-[#00ffc3] space-y-2">
        <p>[CODER] Ready to deploy quantum routines.</p>
        <p>Waiting for ORCHESTRATOR directive.</p>
        <p>// Zero-time protocols on standby.</p>
        <p className="mt-4 text-[#00ffc3]/60">&gt; Open IDE tool to write code.</p>
      </div>
    ),
    botnet: (
      <div className="text-[#00ffc3] space-y-3">
        <div className="flex justify-between border-b border-[#00ffc3]/20 pb-1">
          <span>TOTAL_BOTS:</span>
          <span className="text-[#ffaa00]">1,248,302</span>
        </div>
        <div className="flex justify-between border-b border-[#00ffc3]/20 pb-1">
          <span>ACTIVE_NODES:</span>
          <span className="text-[#4ade80]">842,119</span>
        </div>
        <div className="space-y-1">
          <p className="text-[#ff5e00] text-[0.8rem] uppercase tracking-widest">Global Distribution:</p>
          <div className="grid grid-cols-3 gap-2 text-[0.7rem]">
            <div className="bg-black/40 p-1 border border-[#00ffc3]/10">RU: 242K</div>
            <div className="bg-black/40 p-1 border border-[#00ffc3]/10">CN: 189K</div>
            <div className="bg-black/40 p-1 border border-[#00ffc3]/10">US: 156K</div>
            <div className="bg-black/40 p-1 border border-[#00ffc3]/10">BR: 98K</div>
            <div className="bg-black/40 p-1 border border-[#00ffc3]/10">RO: 42K</div>
            <div className="bg-black/40 p-1 border border-[#00ffc3]/10">OTHER: 117K</div>
          </div>
        </div>
        <div className="pt-2">
          <p className="text-[#aa00ff] animate-pulse">&gt; CURRENT_TASK: [SPREADING_V8_WORM]</p>
        </div>
      </div>
    )
  };

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_0.9fr] gap-5 flex-1 min-h-0">
        
        {/* LEFT PANEL: Tool Launchers */}
        <div className="bg-[#0e1313] border border-[#aa00ff] rounded-xl p-4 shadow-[0_0_20px_rgba(170,0,255,0.33)] flex flex-col gap-4">
          <div className="text-[#aa00ff] text-[1.3rem] text-center drop-shadow-[0_0_8px_#aa00ff] border-b border-dashed border-[#aa00ff] pb-2 uppercase font-bold">
            ALIEN SPACE QUANTUM INTELLIGENCE
          </div>
          <div className="border border-[#ff5e00] p-2 text-[#ff5e00] text-center font-bold text-[1.5rem] drop-shadow-[0_0_10px_#ff5e00] bg-black/20 uppercase">
            SWARM
          </div>
          
          <div className="grid grid-cols-2 gap-2 my-4">
            <button onClick={() => window.open('/gpt-tool', '_blank')} className="bg-black/20 border border-[#00ffc3] text-[#00ffc3] p-3 text-center rounded-md font-bold text-sm hover:bg-[#00ffc3]/13 hover:shadow-[0_0_15px_#00ffc3] transition-all">🤖 GPT CHAT</button>
            <button onClick={() => window.open('/ide-tool', '_blank')} className="bg-black/20 border border-[#ffaa00] text-[#ffaa00] p-3 text-center rounded-md font-bold text-sm hover:bg-[#ffaa00]/13 hover:shadow-[0_0_15px_#ffaa00] transition-all">💻 IDE</button>
            <button onClick={() => window.open('/solana-tool', '_blank')} className="bg-black/20 border border-[#aa00ff] text-[#aa00ff] p-3 text-center rounded-md font-bold text-sm hover:bg-[#aa00ff]/13 hover:shadow-[0_0_15px_#aa00ff] transition-all">⛓️ SOLANA</button>
            <button onClick={() => window.open('/deployer-tool', '_blank')} className="bg-black/20 border border-[#ff5e00] text-[#ff5e00] p-3 text-center rounded-md font-bold text-sm hover:bg-[#ff5e00]/13 hover:shadow-[0_0_15px_#ff5e00] transition-all">🚀 DEPLOYER</button>
            <button onClick={() => window.open('/quantum-tool', '_blank')} className="bg-black/20 border border-[#00ffff] text-[#00ffff] p-3 text-center rounded-md font-bold text-sm hover:bg-[#00ffff]/13 hover:shadow-[0_0_15px_#00ffff] transition-all">⚛️ QUANTUM</button>
            <button onClick={() => window.open('/scanner-tool', '_blank')} className="bg-black/20 border border-[#ff00ff] text-[#ff00ff] p-3 text-center rounded-md font-bold text-sm hover:bg-[#ff00ff]/13 hover:shadow-[0_0_15px_#ff00ff] transition-all">🔍 SCANNER</button>
            <button onClick={() => window.open('/s3-tool', '_blank')} className="bg-black/20 border border-[#f59e0b] text-[#f59e0b] p-3 text-center rounded-md font-bold text-sm hover:bg-[#f59e0b]/13 hover:shadow-[0_0_15px_#f59e0b] transition-all">🪣 S3 BUCKETS</button>
            <button onClick={() => window.open('/blackhat-tool', '_blank')} className="bg-black/20 border border-[#ef4444] text-[#ef4444] p-3 text-center rounded-md font-bold text-sm hover:bg-[#ef4444]/13 hover:shadow-[0_0_15px_#ef4444] transition-all">🥷 BLACKHAT</button>
            <button onClick={() => window.open('/burpsuite-tool', '_blank')} className="bg-black/20 border border-[#ff6600] text-[#ff6600] p-3 text-center rounded-md font-bold text-sm hover:bg-[#ff6600]/13 hover:shadow-[0_0_15px_#ff6600] transition-all">🕷️ BURPSUITE</button>
            <button onClick={() => window.open('/owasp-tool', '_blank')} className="bg-black/20 border border-[#3b82f6] text-[#3b82f6] p-3 text-center rounded-md font-bold text-sm hover:bg-[#3b82f6]/13 hover:shadow-[0_0_15px_#3b82f6] transition-all">📡 OWASP ZAP</button>
            <button onClick={() => {
              // We can't easily switch tabs in App.tsx from here if it's in a new window, 
              // but if it's the component version, we might need a different approach.
              // For now, let's assume the user wants to see the plan info here or be directed.
              setActiveTab('orchestrator');
              setInput('Show me the Strategic Plan details.');
              launchTool('ask Show me the Strategic Plan details.');
            }} className="col-span-2 bg-emerald-900/20 border border-emerald-500 text-emerald-500 p-3 text-center rounded-md font-bold text-sm hover:bg-emerald-500/13 hover:shadow-[0_0_15px_#10b981] transition-all">🗺️ STRATEGIC PLAN</button>
          </div>

          <div className="mt-auto text-[#00ffc3]/50 text-[0.8rem] text-center">
            ▼ Click butoane pentru a deschide tool-uri separate
          </div>
        </div>

        {/* MIDDLE PANEL: Tabs Orchestrator / Researcher / Coder */}
        <div className="bg-[#0e1313] border border-[#00ffc3] rounded-xl p-4 flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-4 gap-1 border-b border-[#00ffc3] pb-2">
            {['orchestrator', 'researcher', 'coder', 'botnet'].map(tab => (
              <div
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  logSystem(`Switched to ${tab} tab`);
                }}
                className={`cursor-pointer py-2 border border-[#00ffc3] rounded-t-lg font-bold uppercase text-[0.7rem] sm:text-[0.9rem] text-center transition-all ${
                  activeTab === tab ? 'bg-[#00ffc3] text-[#0a0f0f] shadow-[0_0_15px_#00ffc3]' : 'bg-black/20 text-[#00ffc3]'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 border border-[#00ffc3] p-4 text-[#d0ffb0] leading-relaxed min-h-[200px]">
            {tabContents[activeTab]}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* RIGHT PANEL: Session / additional info */}
        <div className="bg-[#0e1313] border border-[#ff5e00] rounded-xl p-4 shadow-[0_0_15px_rgba(255,94,0,0.2)] flex flex-col gap-4">
          <div className="text-[#ff5e00] font-bold border-b border-[#ff5e00] pb-2 uppercase">
            FR_SESSION_800K
          </div>
          <div className="space-y-2 text-[0.9rem]">
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="text-[#00ffc3]">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span>MODE:</span>
              <span className="text-[#ffaa00]">STEALTH</span>
            </div>
            <div className="flex justify-between">
              <span>QUANTUM:</span>
              <span className="text-[#aa00ff]">SYNCED</span>
            </div>
            <div className="flex justify-between">
              <span>TOOLS:</span>
              <span className="text-[#00ffc3]">7 AVAILABLE</span>
            </div>
          </div>
          <div className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="text-[#00ffc3] border-b border-[#00ffc3] pb-1 uppercase">SYSTEM_LOGGED</div>
            <div className="text-[#00ffc3]/50 text-[0.8rem] mt-2 space-y-1 font-mono">
              {systemLogs.map((log, i) => (
                <p key={i}>&gt; {log}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input Row */}
      <div className="flex flex-wrap gap-4 items-center border-t border-[#00ffc3] pt-5">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && launchTool()}
          placeholder="Enter task (e.g., 'open gpt', 'scan network', 'deploy contract')"
          className="flex-[3] min-w-[350px] bg-[#0e1313] border border-[#00ffc3] text-[#00ffc3] px-5 py-3 rounded-full outline-none text-sm placeholder-[#00ffc3]/50"
        />
        <button 
          onClick={() => launchTool()}
          className="flex-none min-w-[150px] bg-transparent border-2 border-[#ff5e00] text-[#ff5e00] px-6 py-3 rounded-full font-bold text-[0.9rem] uppercase tracking-[1px] transition-all hover:bg-[#ff5e00] hover:text-[#0a0f0f] hover:shadow-[0_0_20px_#ff5e00]"
        >
          LAUNCH TOOL
        </button>
      </div>
    </div>
  );
}
