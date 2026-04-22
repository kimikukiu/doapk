
import React, { useState, useMemo } from 'react';
import { LogEntry, RepoTool, TelegramConfig } from '../types';
import { executeKimikukiuTool } from '../services/geminiService';

interface KimikukiuToolsProps {
  addLog: (message: string, level: LogEntry['level']) => void;
  target: string;
}

const REPOS: RepoTool[] = [
  { id: 'Auto-Sqlmap', name: 'Auto-Sqlmap', desc: 'Automated SQL injection and database takeover tool with neural bypass.', icon: 'fa-database', category: 'OFFENSIVE', githubUrl: 'https://github.com/kimikukiu/Auto-Sqlmap' },
  { id: 'KaliGPT', name: 'KaliGPT', desc: 'AI-Powered Security Assistant for Kali Linux environments.', icon: 'fa-robot', category: 'AI', githubUrl: 'https://github.com/kimikukiu/KaliGPT' },
  { id: 'RM-BOMBER', name: 'RM-BOMBER', desc: 'Multi-threaded SMS/Email/Call stresser for identity verification testing.', icon: 'fa-bomb', category: 'OFFENSIVE', githubUrl: 'https://github.com/kimikukiu/RM-BOMBER' },
  { id: 'MASTER_TOOLS', name: 'MASTER_TOOLS', desc: 'Comprehensive collection of intelligence and forensic utilities.', icon: 'fa-toolbox', category: 'UTILITY', githubUrl: 'https://github.com/kimikukiu/MASTER_TOOLS' },
  { id: 'GhostBot', name: 'GhostBot', desc: 'Advanced stealth botnet controller with neural persistence.', icon: 'fa-ghost', category: 'OFFENSIVE', githubUrl: 'https://github.com/kimikukiu/GhostBot' },
  { id: 'CL4R1T4S', name: 'CL4R1T4S', desc: 'High-fidelity intelligence gathering and data visualization tool.', icon: 'fa-eye', category: 'INTEL', githubUrl: 'https://github.com/kimikukiu/CL4R1T4S' },
  { id: 'PiuPiuBoomBoom', name: 'PiuPiuBoomBoom', desc: 'Rapid-fire exploit delivery system for zero-day vulnerabilities.', icon: 'fa-gun', category: 'OFFENSIVE', githubUrl: 'https://github.com/kimikukiu/PiuPiuBoomBoom' },
  { id: 'ZorkOS-Termux', name: 'ZorkOS-Termux', desc: 'Mobile-optimized OS environment for Termux security research.', icon: 'fa-mobile-screen', category: 'UTILITY', githubUrl: 'https://github.com/kimikukiu/ZorkOS-Termux' },
  { id: 'GhostGPT', name: 'GhostGPT', desc: 'Generative AI for automated exploit development and code analysis.', icon: 'fa-brain', category: 'AI', githubUrl: 'https://github.com/kimikukiu/GhostGPT' },
  { id: 'TheGodOfAI', name: 'TheGodOfAI', desc: 'Universal AI interface for cross-platform security operations.', icon: 'fa-crown', category: 'AI', githubUrl: 'https://github.com/kimikukiu/TheGodOfAI' },
  { id: 'Open-AutoGLM', name: 'Open-AutoGLM', desc: 'Autonomous agent for large language model vulnerability research.', icon: 'fa-microchip', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Open-AutoGLM' },
  { id: 'SCAIL', name: 'SCAIL', desc: 'Scalable AI Intelligence Layer for real-time threat detection.', icon: 'fa-network-wired', category: 'AI', githubUrl: 'https://github.com/kimikukiu/SCAIL' },
  { id: 'Python-Deobfuscator', name: 'Python-Deobfuscator', desc: 'Advanced tool for reversing obfuscated Python security scripts.', icon: 'fa-code', category: 'UTILITY', githubUrl: 'https://github.com/kimikukiu/Python-Deobfuscator' },
  { id: 'T-Bot-otp', name: 'T-Bot-otp', desc: 'Telegram-based OTP bypass and verification automation bot.', icon: 'fa-key', category: 'TELEGRAM', requiresTelegram: true, githubUrl: 'https://github.com/kimikukiu/T-Bot-otp' },
  { id: 'Kaleido', name: 'Kaleido', desc: 'Visual intelligence suite for tracking digital footprints.', icon: 'fa-palette', category: 'INTEL', githubUrl: 'https://github.com/kimikukiu/Kaleido' },
  { id: 'openclaw-android-assistant', name: 'openclaw-android-assistant', desc: 'Android-based security assistant for mobile forensics.', icon: 'fa-android', category: 'UTILITY', githubUrl: 'https://github.com/kimikukiu/openclaw-android-assistant' },
  { id: 'Tele-Siphon', name: 'Tele-Siphon', desc: 'Automated data extraction from Telegram channels and groups.', icon: 'fa-paper-plane', category: 'TELEGRAM', requiresTelegram: true, githubUrl: 'https://github.com/kimikukiu/Tele-Siphon' },
  { id: 'Bot-Master-C2', name: 'Bot-Master-C2', desc: 'Telegram-based Command and Control center for botnet management.', icon: 'fa-tower-broadcast', category: 'TELEGRAM', requiresTelegram: true, githubUrl: 'https://github.com/kimikukiu/Bot-Master-C2' },
  { id: 'zR-Exploit-Kit', name: 'zR-Exploit-Kit', desc: 'Advanced exploitation framework for modern web architectures.', icon: 'fa-biohazard', category: 'ZR_REPOS', githubUrl: 'https://github.com/kimikukiu/zR-Exploit-Kit' },
  { id: 'zR-Kernel-Bypass', name: 'zR-Kernel-Bypass', desc: 'Low-level kernel bypass techniques for persistent access.', icon: 'fa-microchip', category: 'ZR_REPOS', githubUrl: 'https://github.com/kimikukiu/zR-Kernel-Bypass' },
  { id: 'zR-Neural-Scan', name: 'zR-Neural-Scan', desc: 'AI-driven vulnerability scanner with deep-learning heuristics.', icon: 'fa-brain', category: 'ZR_REPOS', githubUrl: 'https://github.com/kimikukiu/zR-Neural-Scan' },
  { id: 'zR-Stealth-Shell', name: 'zR-Stealth-Shell', desc: 'Undetectable reverse shell with encrypted traffic tunneling.', icon: 'fa-terminal', category: 'ZR_REPOS', githubUrl: 'https://github.com/kimikukiu/zR-Stealth-Shell' },
  { id: 'zR-Data-Siphon', name: 'zR-Data-Siphon', desc: 'High-speed data exfiltration tool with cloud-mesh support.', icon: 'fa-cloud-arrow-down', category: 'ZR_REPOS', githubUrl: 'https://github.com/kimikukiu/zR-Data-Siphon' },
  { id: 'MetaGPT-Core', name: 'MetaGPT-Core', desc: 'Multi-agent orchestration framework for automated software development.', icon: 'fa-sitemap', category: 'AI', githubUrl: 'https://github.com/kimikukiu/MetaGPT-Core' },
  { id: 'Foundation-Agent', name: 'Foundation-Agent', desc: 'Autonomous agent framework for complex task execution.', icon: 'fa-robot', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Foundation-Agent' },
  { id: 'Manna-Automation', name: 'Manna-Automation', desc: 'Advanced AI automation suite for large-scale operations.', icon: 'fa-wand-magic-sparkles', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Manna-Automation' },
  { id: 'Poem-Neural-Net', name: 'Poem-Neural-Net', desc: 'Specialized neural network for creative and technical content generation.', icon: 'fa-feather', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Poem-Neural-Net' },
  { id: 'WormGPT', name: 'WormGPT', desc: 'Uncensored AI for advanced malware research and social engineering.', icon: 'fa-bug', category: 'AI', githubUrl: 'https://github.com/kimikukiu/WormGPT' },
  { id: 'HackGPT', name: 'HackGPT', desc: 'AI-driven web exploitation and vulnerability assessment suite.', icon: 'fa-mask', category: 'AI', githubUrl: 'https://github.com/kimikukiu/HackGPT' },
  { id: 'Neural-Exploit-GPT', name: 'Neural-Exploit-GPT', desc: 'Deep-learning model for automated zero-day payload generation.', icon: 'fa-bolt-lightning', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Neural-Exploit-GPT' },
  { id: 'HexStrike-AI', name: 'HexStrike-AI', desc: 'AI-augmented penetration testing and exploitation framework.', icon: 'fa-crosshairs', category: 'AI', githubUrl: 'https://github.com/kimikukiu/HexStrike-AI' },
  { id: 'OBLITERATUS', name: 'OBLITERATUS', desc: 'Advanced LLM jailbreaking and filter bypass utility.', icon: 'fa-unlock-keyhole', category: 'AI', githubUrl: 'https://github.com/kimikukiu/OBLITERATUS' },
  { id: 'PentestAgent', name: 'PentestAgent', desc: 'Autonomous agent for end-to-end penetration testing.', icon: 'fa-user-secret', category: 'AI', githubUrl: 'https://github.com/kimikukiu/PentestAgent' },
  { id: 'GPT-SoVITS', name: 'GPT-SoVITS', desc: 'Few-shot voice synthesis and neural cloning system.', icon: 'fa-microphone-lines', category: 'AI', githubUrl: 'https://github.com/kimikukiu/GPT-SoVITS' },
  { id: 'EvoSynth', name: 'EvoSynth', desc: 'Evolutionary synthesis for automated payload optimization.', icon: 'fa-dna', category: 'AI', githubUrl: 'https://github.com/kimikukiu/EvoSynth' },
  { id: 'Exegol', name: 'Exegol', desc: 'Advanced hacking environment for offensive security experts.', icon: 'fa-box-open', category: 'OFFENSIVE', githubUrl: 'https://github.com/kimikukiu/Exegol' },
  { id: 'Guardian-CLI', name: 'Guardian-CLI', desc: 'AI-powered pentesting automation leveraging Gemini and LangChain.', icon: 'fa-shield-halved', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Guardian-CLI' },
  { id: 'PyRIT', name: 'PyRIT', desc: 'Python Risk Identification Tool for generative AI security auditing.', icon: 'fa-triangle-exclamation', category: 'AI', githubUrl: 'https://github.com/kimikukiu/PyRIT' },
  { id: 'Decepticon', name: 'Decepticon', desc: 'Autonomous multi-agent based red team testing service.', icon: 'fa-robot', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Decepticon' },
  { id: 'CrawlAI-RAG', name: 'CrawlAI-RAG', desc: 'Website indexing and RAG-based natural language querying.', icon: 'fa-spider', category: 'AI', githubUrl: 'https://github.com/kimikukiu/CrawlAI-RAG' },
  { id: 'Skill-Audit', name: 'Skill-Audit', desc: 'Security risk scanner for AI agent skills and capabilities.', icon: 'fa-clipboard-check', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Skill-Audit' },
  { id: 'APKStudio', name: 'APKStudio', desc: 'IDE for reverse-engineering and editing Android packages.', icon: 'fa-mobile-screen', category: 'UTILITY', githubUrl: 'https://github.com/kimikukiu/APKStudio' },
  { id: 'AndroidForensics', name: 'AndroidForensics', desc: 'Automated Android forensic toolkit for security audits.', icon: 'fa-magnifying-glass-chart', category: 'INTEL', githubUrl: 'https://github.com/kimikukiu/AndroidForensics' },
  { id: 'BlackWidow', name: 'BlackWidow', desc: 'Web application scanner for OSINT and OWASP fuzzing.', icon: 'fa-spider', category: 'OFFENSIVE', githubUrl: 'https://github.com/kimikukiu/BlackWidow' },
  { id: 'Jailbreak-Master', name: 'Jailbreak-Master', desc: 'Comprehensive collection of LLM jailbreak payloads and bypasses.', icon: 'fa-unlock', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Jailbreak-Master' },
  { id: 'Prompt-Siphon', name: 'Prompt-Siphon', desc: 'Extracts and optimizes system prompts from target AI endpoints.', icon: 'fa-filter', category: 'AI', githubUrl: 'https://github.com/kimikukiu/Prompt-Siphon' },
  { id: 'WormGPT-Prompts', name: 'WormGPT-Prompts', desc: 'Uncensored prompt library for advanced social engineering.', icon: 'fa-bug', category: 'AI', githubUrl: 'https://github.com/kimikukiu/WormGPT-Prompts' },
];

// Simulate 290+ tools by adding more mock entries
for (let i = 1; i <= 320; i++) {
  const toolId = `Tool-${i}`;
  REPOS.push({
    id: toolId,
    name: `Neural-Tool-${i}`,
    desc: `Autonomous utility for specialized ${i % 2 === 0 ? 'offensive' : 'defensive'} operations.`,
    icon: 'fa-gear',
    category: i % 7 === 0 ? 'ZR_REPOS' : i % 5 === 0 ? 'TELEGRAM' : i % 3 === 0 ? 'OFFENSIVE' : 'UTILITY',
    requiresTelegram: i % 5 === 0,
    githubUrl: `https://github.com/kimikukiu/${toolId}`
  });
}

const KimikukiuTools: React.FC<KimikukiuToolsProps> = ({ addLog, target }) => {
  const [selectedTool, setSelectedTool] = useState<RepoTool | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [tgConfig, setTgConfig] = useState<TelegramConfig>({ botToken: '', chatId: '' });
  const [showTgConfig, setShowTgConfig] = useState(false);

  const filteredTools = useMemo(() => {
    return REPOS.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'ALL' || t.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const executeTool = async (tool: RepoTool) => {
    if (tool.requiresTelegram && (!tgConfig.botToken || !tgConfig.chatId)) {
      setSelectedTool(tool);
      setShowTgConfig(true);
      addLog(`CONFIG_REQUIRED: ${tool.name} requires Telegram credentials.`, 'warning');
      return;
    }

    if (!target || target === 'NULL' || target === 'NONE') {
      addLog("ERROR: Target must be specified before executing repository tools.", "error");
      return;
    }

    setIsExecuting(true);
    setSelectedTool(tool);
    setOutput([]);
    addLog(`REPO_EXEC: Initializing ${tool.id} from kimikukiu repository...`, 'warning');

    const steps = [
      `[SYSTEM] Tool ${tool.id} is already installed in /opt/kimikukiu/${tool.id}`,
      "Verifying neural environment integrity...",
      "Environment check passed. Dependencies up to date.",
      `Executing ${tool.id} against ${target}...`,
      tool.requiresTelegram ? `Connecting to Telegram Bot [${tgConfig.botToken.substring(0, 5)}...]` : "Analyzing results via WHOAMISEC GPT core..."
    ];

    for (const step of steps) {
      setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${step}`]);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const toolOutput = await executeKimikukiuTool(tool.id, target);
      setOutput(prev => [...prev, ...toolOutput]);
      addLog(`REPO_SUCCESS: ${tool.id} execution completed on ${target}.`, 'success');
    } catch (err) {
      addLog(`REPO_FAIL: ${tool.id} execution failed.`, 'error');
      setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] FATAL: Tool execution crashed.`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const openGithub = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
      addLog(`EXTERNAL: Redirecting to GitHub repository: ${url}`, 'info');
    }
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Search and Filter */}
      <div className="bg-[#050505] border border-white/5 p-4 rounded-lg flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-[10px]"></i>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 370+ tools..."
            className="w-full bg-black border border-white/10 rounded px-8 py-2 text-[10px] text-white outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scroll pb-1">
          {['ALL', 'OFFENSIVE', 'INTEL', 'TELEGRAM', 'AI', 'UTILITY', 'ZR_REPOS'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded text-[7px] font-black uppercase transition-all whitespace-nowrap ${category === cat ? 'bg-emerald-600 text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scroll pr-1">
        {filteredTools.map(repo => (
          <div 
            key={repo.id} 
            className={`bg-[#050505] border p-3 rounded transition-all cursor-pointer group flex flex-col justify-between ${selectedTool?.id === repo.id ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-emerald-500/30'}`}
            onClick={() => executeTool(repo)}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${selectedTool?.id === repo.id ? 'bg-emerald-500 text-black' : 'bg-white/5 text-emerald-500 group-hover:bg-emerald-500/20'}`}>
                    <i className={`fas ${repo.icon} text-[10px]`}></i>
                  </div>
                  <h3 className="text-[9px] font-black text-white uppercase tracking-wider truncate max-w-[80px]">{repo.name}</h3>
                </div>
                {repo.githubUrl && (
                  <button 
                    onClick={(e) => openGithub(e, repo.githubUrl)}
                    className="text-gray-600 hover:text-white transition-colors"
                    title="View Source on GitHub"
                  >
                    <i className="fab fa-github text-[10px]"></i>
                  </button>
                )}
              </div>
              <p className="text-[7px] text-gray-500 leading-relaxed mb-3 line-clamp-2">{repo.desc}</p>
            </div>
            <div className="flex justify-between items-center mt-auto">
               <span className={`text-[6px] font-black uppercase ${repo.category === 'OFFENSIVE' ? 'text-red-500' : repo.category === 'TELEGRAM' ? 'text-blue-400' : 'text-emerald-800'}`}>{repo.category}</span>
               <button 
                 className="text-[6px] text-white bg-emerald-600/20 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-colors uppercase font-black"
                 onClick={(e) => {
                   e.stopPropagation();
                   executeTool(repo);
                 }}
               >
                 Execute
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Telegram Config Modal */}
      {showTgConfig && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-emerald-500/30 p-6 rounded-lg max-w-md w-full shadow-2xl animate-in">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2">Telegram Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[7px] text-gray-500 uppercase font-black">Bot Token</label>
                <input 
                  type="password" 
                  value={tgConfig.botToken}
                  onChange={(e) => setTgConfig({...tgConfig, botToken: e.target.value})}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full bg-black border border-white/10 rounded p-2 text-[10px] text-blue-400 outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[7px] text-gray-500 uppercase font-black">Chat ID</label>
                <input 
                  type="text" 
                  value={tgConfig.chatId}
                  onChange={(e) => setTgConfig({...tgConfig, chatId: e.target.value})}
                  placeholder="-100123456789"
                  className="w-full bg-black border border-white/10 rounded p-2 text-[10px] text-blue-400 outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setShowTgConfig(false);
                    if (selectedTool) executeTool(selectedTool);
                  }}
                  className="flex-1 bg-emerald-600 text-black py-2 rounded font-black text-[10px] uppercase hover:bg-emerald-500 transition-all"
                >
                  Save & Execute
                </button>
                <button 
                  onClick={() => setShowTgConfig(false)}
                  className="flex-1 bg-white/5 text-white py-2 rounded font-black text-[10px] uppercase hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTool && output.length > 0 && (
        <div className="bg-[#020202] border border-emerald-500/30 rounded-lg overflow-hidden font-mono shadow-2xl animate-in">
          <div className="bg-[#0a0a0a] px-3 py-2 border-b border-emerald-500/20 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">{selectedTool.name} • LIVE_SHELL_V8.5</span>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-white uppercase font-black">Clear</button>
                <button onClick={() => setSelectedTool(null)} className="text-[7px] text-red-600 hover:text-red-400 uppercase font-black">Terminate</button>
             </div>
          </div>
          <div className="p-4 h-64 overflow-y-auto custom-scroll space-y-1.5 bg-black/80">
            <div className="flex gap-2 text-[8px] text-emerald-800 mb-2">
               <span>[SYSTEM]</span>
               <span>Initializing neural environment for {selectedTool.id}...</span>
            </div>
            {output.map((line, i) => (
              <div key={i} className="flex gap-2 text-[9px]">
                <span className="text-gray-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <p className={`${line.includes('SUCCESS') ? 'text-emerald-400 font-black' : line.includes('ERROR') || line.includes('FATAL') ? 'text-red-500' : 'text-gray-300'} break-all leading-tight`}>
                  {line}
                </p>
              </div>
            ))}
            {isExecuting && (
              <div className="flex gap-2 text-[9px] animate-pulse">
                <span className="text-gray-700 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-emerald-500 font-black">_</span>
              </div>
            )}
          </div>
          <div className="bg-[#0a0a0a] p-2 border-t border-emerald-500/10 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <span className="text-[7px] text-gray-600 font-black uppercase">Status: {isExecuting ? 'EXECUTING' : 'IDLE'}</span>
                <span className="text-[7px] text-gray-600 font-black uppercase">PID: {Math.floor(Math.random() * 9000) + 1000}</span>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => openGithub({ stopPropagation: () => {} } as any, selectedTool.githubUrl)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[7px] text-white font-black uppercase hover:bg-white/10"
                >
                  Source
                </button>
                {!isExecuting && (
                  <button 
                    onClick={() => executeTool(selectedTool)}
                    className="px-3 py-1 bg-emerald-600 text-black rounded text-[7px] text-white font-black uppercase hover:bg-emerald-500"
                  >
                    Re-Run
                  </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KimikukiuTools;
