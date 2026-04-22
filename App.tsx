
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useLocalStorage } from './src/hooks/useLocalStorage';
import Sidebar from './components/Sidebar';
import Terminal from './components/Terminal';
import KimikukiuTools from './components/KimikukiuTools';
import WhoamiGpt from './components/WhoamiGpt';
import MediaCreators from './components/MediaCreators';
import SqlInject from './components/SqlInject';
import BotnetCore from './components/BotnetCore';
import Settings from './components/Settings';
import QuantumIntelligenceUltra from './components/QuantumIntelligence';
import { AppTab, LogEntry, OSINTResult, ThreatFeedItem, Exploit, ExploitHistoryItem, LeakedRecord, NetworkConfig, BotNode, AIConfig } from './types';
import { analyzeTarget, generateLeakedData } from './services/geminiService';
import AIConfigPanel from './components/AIConfigPanel';
import { setAIConfig, loadAIConfigFromStorage } from './src/services/aiService';
import LoginGate from './components/LoginGate';

import GptTool from './components/tools/GptTool';
import IdeTool from './components/tools/IdeTool';
import SolanaTool from './components/tools/SolanaTool';
import DeployerTool from './components/tools/DeployerTool';
import QuantumTool from './components/tools/QuantumTool';
import ScannerTool from './components/tools/ScannerTool';
import S3Tool from './components/tools/S3Tool';
import BlackhatTool from './components/tools/BlackhatTool';
import LazarusTool from './components/tools/LazarusTool';
import BurpSuiteTool from './components/tools/BurpSuiteTool';
import OwaspTool from './components/tools/OwaspTool';
import { ZxCDDoS } from './components/tools/ZxCDDoS';
import LispAiControl from './components/tools/LispAiControl';
import LispCryptoPanel from './components/tools/LispCryptoPanel';
import LispDatabasePanel from './components/tools/LispDatabasePanel';
import LispNeuralPanel from './components/tools/LispNeuralPanel';
import LispCiscoPanel from './components/tools/LispCiscoPanel';
import LispClispPanel from './components/tools/LispClispPanel';
import LispBreakerPanel from './components/tools/LispBreakerPanel';
import CycorpPanel from './components/tools/CycorpPanel';
import GptModulePanel from './components/tools/GptModulePanel';
import BotnetC2Panel from './components/tools/BotnetC2Panel';
import InvestigationAITool from './components/tools/InvestigationAITool';
import OSINTInvestigationTool from './components/tools/OSINTInvestigationTool';
import AndroidInvestigationTool from './components/tools/AndroidInvestigationTool';
import AWSMetadataTool from './components/tools/AWSMetadataTool';
import FileDiscoveryTool from './components/tools/FileDiscoveryTool';

const BOT_LOCATIONS: BotNode[] = [
  { id: 'WHOAMI-US-CLUSTER', country: 'United States', status: 'ONLINE', latency: 28, uptime: '45d', type: 'SERVER' },
  { id: 'WHOAMI-EU-CLUSTER', country: 'European Union', status: 'ONLINE', latency: 34, uptime: '112d', type: 'SERVER' },
  { id: 'WHOAMI-AS-CLUSTER', country: 'Asia Pacific', status: 'BUSY', latency: 110, uptime: '12d', type: 'IOT' },
  { id: 'WHOAMI-RU-CLUSTER', country: 'Russia/CIS', status: 'ONLINE', latency: 85, uptime: '89d', type: 'SERVER' },
  { id: 'WHOAMI-BR-CLUSTER', country: 'South America', status: 'ONLINE', latency: 140, uptime: '5d', type: 'IOT' },
  { id: 'WHOAMI-ME-CLUSTER', country: 'Middle East', status: 'ONLINE', latency: 95, uptime: '31d', type: 'DESKTOP' },
];

const STRATEGIES = {
  [AppTab.OSINT_DASHBOARD]: ["Global Threat Intelligence", "Open Source Reconnaissance", "Dark-Web Leak Scanner"],
  [AppTab.EXTRACTOR]: ["Full-Spectrum Reaper", "Social Profile Siphon", "Cloud Identity Harvester", "Dark-Web Leak Scanner"],
  [AppTab.SQL_INJECT]: ["Neural Auth Bypass", "Blind-Time Schema Crawler", "Universal Dumper", "0-Day Payload Injector"],
  [AppTab.CMS_EXPLOIT]: ["Zombie-Mesh CMS Scan", "WordPress Auth Shredder", "Ghost-Bypass Core"],
  [AppTab.NETWORK]: [
    "RAW-MIX (SOCKET)", 
    "GOJO-V5 (STORM)", 
    "REX-H2 (ULTRA)", 
    "SSH-STRESS (BRUTE)",
    "CRISX-CORE (HPACK)",
    "DNS-SHREDDER (UDP4)", 
    "DROWN-X (HTTP/S)", 
    "STARS-X (FETCH)", 
    "BYPASS-V9 (TRON)"
  ]
};

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useLocalStorage<AppTab>('app_activeTab', AppTab.DASHBOARD);
  const [targetInput, setTargetInput] = useLocalStorage('app_targetInput', '');
  const [isScanning, setIsScanning] = useLocalStorage('app_isScanning', false);
  const [isExploiting, setIsExploiting] = useLocalStorage('app_isExploiting', false);
  const [isAttacking, setIsAttacking] = useLocalStorage('app_isAttacking', false);
  const [isTargetUp, setIsTargetUp] = useLocalStorage('app_isTargetUp', true);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('app_logs', []);
  const [currentResult, setCurrentResult] = useLocalStorage<OSINTResult | null>('app_currentResult', null);
  const [selectedExploit, setSelectedExploit] = useLocalStorage<Exploit | null>('app_selectedExploit', null);
  const [viewingExploitResult, setViewingExploitResult] = useLocalStorage<ExploitHistoryItem | null>('app_viewingExploitResult', null);
  const [threatFeed, setThreatFeed] = useLocalStorage<ThreatFeedItem[]>('app_threatFeed', []);
  const [attackStats, setAttackStats] = useLocalStorage('app_attackStats', { packets: 0, visitors: 0, throughput: 0 });
  
  const [isGptMinimized, setIsGptMinimized] = useLocalStorage('app_isGptMinimized', false);
  const [isTerminalOpen, setIsTerminalOpen] = useLocalStorage('app_isTerminalOpen', false);
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'zip'>('txt');
  
  const handleDownload = async (report: string, target: string) => {
    const fileName = `OSINT_REPORT_${target.replace(/\./g, '_')}`;
    if (downloadFormat === 'zip') {
      const zip = new JSZip();
      zip.file(`${fileName}.txt`, report);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${fileName}.zip`);
    } else {
      const blob = new Blob([report], { type: 'text/plain' });
      saveAs(blob, `${fileName}.txt`);
    }
    addLog(`OSINT: Intelligence report exported to ${downloadFormat.toUpperCase()}.`, "success");
  };
  
  const [useExternalApis, setUseExternalApis] = useLocalStorage('app_useExternalApis', true);
  const [osintScrapeMode, setOsintScrapeMode] = useLocalStorage('app_osintScrapeMode', 'ALL');
  const [osintQuantumAi, setOsintQuantumAi] = useLocalStorage('app_osintQuantumAi', false);
  
  const attackIntervalRef = useRef<any>(null);

  const [netConfig, setNetConfig] = useLocalStorage<NetworkConfig>('app_netConfig', {
    threads: 10,
    time: 120,
    rqs: 500000,
    proxyScrape: true,
    method: 'RAW-MIX (SOCKET)',
    powerLevel: 'Turbo',
    payloadSize: 16384,
    headerJitter: true,
    port: 80,
    rateLimit: 64,
    sshUser: 'root'
  });

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'openrouter',
    openrouterKey: '',
    openaiKey: '',
    anthropicKey: "",
    geminiKey: '',
    mistralKey: "",
    llamaKey: "",
    deepseekKey: '',
    deepseekBaseUrl: "http://localhost:8000",
    selectedModel: 'openai/gpt-4o',
    enableGemini: false,
  });

  // Load AI config on mount
  useEffect(() => {
    const stored = loadAIConfigFromStorage();
    if (stored) {
      setAiConfig(stored);
    }
  }, []);

  const handleAIConfigChange = (newConfig: AIConfig) => {
    setAiConfig(newConfig);
    setAIConfig(newConfig);
    addLog(`AI_CONFIG: Provider set to ${newConfig.provider} (${newConfig.selectedModel})`, 'success');
  };

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      message,
      level
    };
    setLogs(prev => [...prev.slice(-150), newLog]);
  }, []);

  useEffect(() => {
    if (isScanning) {
      setIsScanning(false);
      addLog('OSINT_WARN: Scan interrupted by system reboot. Ready for new task.', 'warning');
    }
    if (isExploiting) {
      setIsExploiting(false);
      addLog('EXPLOIT_WARN: Exploit interrupted by system reboot. Ready for new task.', 'warning');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const events = [
      "SWARM: Synchronizing 800,000 heartbeat cycles...",
      "RAW-MIX: Buffer overhead minimized. Socket reuse: ENABLED.",
      "GOJO-V5: Storm protocol detected. Cloudflare status: BYPASSED.",
      "REX-H2: Title monitoring active. 200 OK verified.",
      "SSH-STRESS: Port 22 handshake initiated via Medusa core.",
      "CRISX-CORE: HPACK encoding frequency peaked at 50,000 p/s."
    ];
    const updateFeed = () => {
      const newItem: ThreatFeedItem = {
        id: Math.random().toString(36),
        source: "SWARM_MASTER",
        event: events[Math.floor(Math.random() * events.length)],
        time: new Date().toLocaleTimeString()
      };
      setThreatFeed(prev => [newItem, ...prev].slice(0, 10));
    };
    updateFeed();
    const interval = setInterval(updateFeed, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    if (!targetInput) return;
    setIsScanning(true);
    addLog(`OSINT_INIT: Executing Forensic Reaper on ${targetInput} [Mode: ${osintScrapeMode}]...`, 'warning');
    if (useExternalApis) {
      addLog(`OSINT_API: Connecting to external intelligence nodes (Shodan, HIBP, Hunter)...`, 'info');
    }
    if (osintQuantumAi) {
      addLog(`QUANTUM_AI: AI Assistant engaged for enhanced data correlation and accuracy.`, 'info');
    }
    try {
      const result = await analyzeTarget(targetInput, 'full', 'Forensic Reaper', useExternalApis, osintQuantumAi, osintScrapeMode);
      setCurrentResult(result);
      addLog(`REAPER_OK: Identified ${result.emails.length} deep-web identity vectors.`, 'success');
    } catch (err) {
      addLog(`REAPER_FAIL: Target response malformed. Falling back to Z.AI Unlimited API...`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const startDdos = () => {
    if (!targetInput) return;
    setIsAttacking(true);
    setIsTargetUp(false);
    
    let command = "";
    const m = netConfig.method;
    
    if (m.includes("RAW-MIX")) command = `node RAW-MIX.js ${targetInput} ${netConfig.time}`;
    else if (m.includes("GOJO-V5")) command = `node gojov5 ${targetInput} ${netConfig.time} ${netConfig.rateLimit} ${netConfig.threads} proxy.txt`;
    else if (m.includes("REX-H2")) command = `node Rex.js ${targetInput} ${netConfig.time} ${netConfig.rateLimit} ${netConfig.threads} proxy.txt`;
    else if (m.includes("SSH")) command = `node ssh_flood.js ${targetInput} ${netConfig.port} ${netConfig.sshUser} ${netConfig.time}`;
    else if (m.includes("CRISX")) command = `node CRISXTOP.js ${targetInput} ${netConfig.time} ${netConfig.rateLimit} ${netConfig.threads} proxy.txt`;
    else if (m.includes("DNS")) command = `node dns_flood.js ${targetInput} ${netConfig.port} ${netConfig.time}`;
    else if (m.includes("DROWN")) command = `node drown.js ${targetInput} ${netConfig.time} ${netConfig.threads} ${netConfig.rateLimit}`;
    else command = `node StarsXDoS-V1.js ${targetInput} ${netConfig.time}`;

    addLog(`INIT_SWARM: ${command}`, 'critical');
  };

  const stopDdos = () => {
    setIsAttacking(false);
    setIsTargetUp(true);
    addLog(`SWARM_HALT: Command sent to 800,000 nodes.`, 'warning');
  };

  useEffect(() => {
    let interval: any;
    if (isAttacking) {
      interval = setInterval(() => {
        setAttackStats(prev => ({
          packets: prev.packets + Math.floor(Math.random() * 20000000) + 10000000,
          visitors: prev.visitors + Math.floor(Math.random() * 60000) + 20000,
          throughput: Math.floor(Math.random() * 40) + 80
        }));
        setIsTargetUp(false);
        addLog(`SWARM_STATUS: High visitor acceptance. Target capacity saturated.`, 'success');
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAttacking, addLog, setAttackStats, setIsTargetUp]);

  const handleSetActiveTab = useCallback((tab: AppTab) => {
    if (tab === AppTab.WHOAMISEC_GPT) {
      setIsGptMinimized(false);
    }
    setActiveTab(tab);
  }, []);

  const handleMinimizeGpt = useCallback(() => {
    setIsGptMinimized(true);
    setActiveTab(AppTab.DASHBOARD);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#000] text-[#e2e8f0] font-mono text-[10px] antialiased">
      <Sidebar activeTab={activeTab} setActiveTab={handleSetActiveTab} target={targetInput || "NULL"} isUp={isTargetUp} isAttacking={isAttacking} netConfig={netConfig} />
      
      <main className="flex-1 ml-16 md:ml-56 overflow-y-auto p-4 custom-scroll pb-20 transition-all">
        {/* Compact Header */}
        <header className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
          <div>
            <h1 className="text-sm font-black tracking-tighter text-white uppercase italic">WHOAMISec <span className="text-emerald-500">Pro V8.5</span></h1>
            <p className="text-[7px] text-gray-700 uppercase tracking-widest">Autonomous Identity & Stresser PC Software Suite</p>
          </div>
          <div className="flex gap-4 items-center">
             <div className="px-2 py-1 bg-black border border-white/5 rounded">
                <span className="text-[6px] text-gray-700 uppercase block leading-none">Accepted Visitors</span>
                <span className={`font-black ${isAttacking ? 'text-emerald-500' : 'text-gray-900'}`}>{isAttacking ? (attackStats.visitors / 1000).toFixed(1) + 'K/s' : '0.0K/s'}</span>
             </div>
             <div className="px-2 py-1 bg-black border border-white/5 rounded">
                <span className="text-[6px] text-gray-700 uppercase block leading-none">Throughput Peak</span>
                <span className={`font-black ${isAttacking ? 'text-fuchsia-500' : 'text-gray-900'}`}>{isAttacking ? attackStats.throughput + ' Tbps' : '0.0 Tbps'}</span>
             </div>
          </div>
        </header>

        {activeTab === AppTab.DASHBOARD && (
          <div className="space-y-4 animate-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#050505] border border-white/5 p-4 rounded h-[220px] relative overflow-hidden flex flex-col">
                   <h3 className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Swarm Distribution Matrix</h3>
                   <div className="flex-1 flex items-center justify-around">
                      {BOT_LOCATIONS.map(b => (
                        <div key={b.id} className="flex flex-col items-center gap-2">
                           <div className={`w-8 h-8 rounded border flex items-center justify-center ${isAttacking ? 'border-fuchsia-600 bg-fuchsia-600/10 shadow-[0_0_10px_#c026d3] animate-pulse' : 'border-emerald-900'}`}>
                              <i className="fas fa-microchip text-[10px]"></i>
                           </div>
                           <span className="text-[5px] uppercase text-gray-600 font-bold">{b.country.split(' ')[0]}</span>
                        </div>
                      ))}
                   </div>
                   {isAttacking && (
                     <div className="absolute top-2 right-2 text-[7px] text-fuchsia-500 font-black animate-bounce uppercase">Target: INFILTRATED</div>
                   )}
                </div>
                <div className="bg-[#050505] border border-white/5 p-4 rounded h-[220px] flex flex-col">
                   <h3 className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Live Attack Intelligence</h3>
                   <div className="flex-1 overflow-y-auto custom-scroll space-y-1">
                      {threatFeed.map(t => (
                        <div key={t.id} className="p-2 bg-black border border-white/5 rounded text-[8px]">
                           <div className="flex justify-between text-emerald-800 font-black mb-1 italic"><span>{t.source}</span><span>{t.time}</span></div>
                           <p className="text-gray-400 font-bold">{t.event}</p>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === AppTab.OSINT_DASHBOARD && (
          <div className="space-y-4 animate-in">
             <div className="bg-[#050505] border border-white/5 p-6 rounded-lg text-center shadow-inner relative">
                <div className="absolute top-0 right-0 p-2 opacity-10"><i className="fas fa-globe text-4xl"></i></div>
                <h2 className="text-lg font-black text-white uppercase italic mb-1 tracking-tighter">WHOAMISec <span className="text-blue-500">OSINT Dashboard</span></h2>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-4 font-bold">Global Threat Intelligence & Open Source Reconnaissance</p>
                <div className="flex max-w-2xl mx-auto gap-2 mb-4">
                   <div className="flex-1 relative">
                      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50 text-[10px]"></i>
                      <input type="text" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="ENTER_TARGET_DOMAIN_OR_IP" className="w-full bg-black border border-white/10 rounded px-10 py-2 text-blue-400 text-[11px] outline-none shadow-inner font-mono" />
                   </div>
                   <button onClick={handleScan} disabled={isScanning} className="bg-blue-600 text-black px-4 py-1.5 rounded font-black text-[10px] uppercase hover:bg-blue-500 transition-all shadow-xl">
                      {isScanning ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-radar mr-2"></i>}
                      {isScanning ? 'GATHERING...' : 'INITIATE_RECON'}
                   </button>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {['ALL', 'SOCIAL', 'DEEPWEB', 'CORP'].map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setOsintScrapeMode(mode)}
                      className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${osintScrapeMode === mode ? 'bg-blue-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                    >
                      Scrape {mode}
                    </button>
                  ))}
                  <button 
                    onClick={() => setOsintQuantumAi(!osintQuantumAi)}
                    className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all flex items-center gap-1 ${osintQuantumAi ? 'bg-[#00ffc3] text-black shadow-[0_0_10px_#00ffc3]' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                  >
                    <i className="fas fa-brain"></i> Quantum Intelligence Ultra {osintQuantumAi ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-500">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useExternalApis} 
                      onChange={(e) => setUseExternalApis(e.target.checked)}
                      className="accent-blue-500"
                    />
                    <span>Enable Deep Web & External OSINT APIs</span>
                  </label>
                </div>
             </div>

             {currentResult && (
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/40 p-3 border border-white/5 rounded-lg">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">OSINT Report: {currentResult.target}</span>
                     </div>
                     <button 
                        onClick={() => {
                          const report = `OSINT WHOAMISec Pro V8.5 - Intelligence Report\nTarget: ${currentResult.target}\nTimestamp: ${currentResult.timestamp}\n\n[EMAILS]\n${currentResult.emails.join('\n')}\n\n[PASSWORDS]\n${(currentResult.passwords || []).join('\n')}\n\n[ADMIN_LINKS]\n${(currentResult.adminLinks || []).join('\n')}\n\n[PHONES]\n${currentResult.phones.join('\n')}\n\n[SOCIAL_MEDIA]\n${currentResult.socialMedia.join('\n')}\n\n[TELEGRAM/TIKTOK]\n${[...currentResult.telegram, ...currentResult.tiktok].join('\n')}\n\n[BREACHES]\n${currentResult.breaches.join('\n')}\n\n[SUMMARY]\n${currentResult.summary}`;
                          handleDownload(report, currentResult.target);
                        }}
                        className="bg-blue-600/20 text-blue-500 border border-blue-500/30 px-4 py-1.5 rounded font-black text-[9px] uppercase hover:bg-blue-500 hover:text-black transition-all"
                     >
                        Download_Full_Report
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <ResultPane title="Extracted Emails" icon="fa-at" items={currentResult.emails.map(e => ({ val: e, meta: 'DATA_ENDPOINT' }))} color="blue" />
                     <ResultPane title="Leaked Passwords" icon="fa-key" items={(currentResult.passwords || []).map(p => ({ val: p, meta: 'CREDENTIAL' }))} color="red" />
                     <ResultPane title="Admin Portals" icon="fa-door-open" items={(currentResult.adminLinks || []).map(a => ({ val: a, meta: 'INFRASTRUCTURE' }))} color="fuchsia" />
                     <ResultPane title="GSM Vectors" icon="fa-satellite" items={currentResult.phones.map(p => ({ val: p, meta: 'MOBILE_GATE' }))} color="emerald" />
                     <ResultPane title="Detected Leaks" icon="fa-biohazard" items={currentResult.breaches.map(b => ({ val: b, meta: 'CRITICAL_SOURCE' }))} color="orange" />
                     <ResultPane title="Social Footprint" icon="fa-share-nodes" items={currentResult.socialMedia.map(s => ({ val: s, meta: 'PLATFORM_LINK' }))} color="purple" />
                     <ResultPane title="Messaging IDs" icon="fa-paper-plane" items={[...currentResult.telegram.map(t => ({ val: t, meta: 'TELEGRAM' })), ...currentResult.tiktok.map(t => ({ val: t, meta: 'TIKTOK' }))]} color="cyan" />
                     <ResultPane title="Scraped Assets" icon="fa-file-shield" items={currentResult.scrapedFiles?.map(f => ({ val: `${f.name}.${f.extension} (${f.size})`, meta: f.source })) || []} color="yellow" />
                  </div>

                  <div className="bg-[#050505] border border-white/5 p-4 rounded-lg">
                     <h3 className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <i className="fas fa-brain"></i> Neural Intelligence Summary
                     </h3>
                     <p className="text-[10px] text-gray-400 leading-relaxed italic border-l-2 border-blue-500/30 pl-4 py-1">
                        {currentResult.summary}
                     </p>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === AppTab.EXTRACTOR && (
          <div className="space-y-4 animate-in">
             <div className="bg-[#050505] border border-white/5 p-6 rounded-lg text-center shadow-inner relative">
                <div className="absolute top-0 right-0 p-2 opacity-10"><i className="fas fa-user-secret text-4xl"></i></div>
                <h2 className="text-lg font-black text-white uppercase italic mb-1 tracking-tighter">WHOAMISec <span className="text-emerald-500">Cloud Scraper Engine</span></h2>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-4 font-bold">Autonomous OSINTBits/Chiasmodon Simulation - AWS/Alibaba/Azure</p>
                <div className="flex max-w-2xl mx-auto gap-2 mb-4">
                   <div className="flex-1 relative">
                      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 text-[10px]"></i>
                      <input type="text" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="DOMAIN_OR_TARGET_IP" className="w-full bg-black border border-white/10 rounded px-10 py-2 text-emerald-400 text-[11px] outline-none shadow-inner font-mono" />
                   </div>
                   <button onClick={handleScan} disabled={isScanning} className="bg-emerald-600 text-black px-4 py-1.5 rounded font-black text-[10px] uppercase hover:bg-emerald-500 transition-all shadow-xl">
                      {isScanning ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-crosshairs mr-2"></i>}
                      {isScanning ? 'EXTRACTING...' : 'REAP_RECORDS'}
                   </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-500">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useExternalApis} 
                      onChange={(e) => setUseExternalApis(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Enable External OSINT APIs & Cloud Bucket Scraping (AWS/Alibaba/Azure)</span>
                  </label>
                </div>
             </div>

             {currentResult && (
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/40 p-3 border border-white/5 rounded-lg">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Intelligence Report: {currentResult.target}</span>
                     </div>
                     <button 
                        onClick={() => {
                          const report = `OSINT WHOAMISec Pro V8.5 - Intelligence Report\nTarget: ${currentResult.target}\nTimestamp: ${currentResult.timestamp}\n\n[EMAILS]\n${currentResult.emails.join('\n')}\n\n[PASSWORDS]\n${(currentResult.passwords || []).join('\n')}\n\n[ADMIN_LINKS]\n${(currentResult.adminLinks || []).join('\n')}\n\n[PHONES]\n${currentResult.phones.join('\n')}\n\n[SOCIAL_MEDIA]\n${currentResult.socialMedia.join('\n')}\n\n[TELEGRAM/TIKTOK]\n${[...currentResult.telegram, ...currentResult.tiktok].join('\n')}\n\n[BREACHES]\n${currentResult.breaches.join('\n')}\n\n[SUMMARY]\n${currentResult.summary}`;
                          handleDownload(report, currentResult.target);
                        }}
                        className="bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 px-4 py-1.5 rounded font-black text-[9px] uppercase hover:bg-emerald-500 hover:text-black transition-all"
                     >
                        Download_Full_Report
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <ResultPane title="Extracted Emails" icon="fa-at" items={currentResult.emails.map(e => ({ val: e, meta: 'DATA_ENDPOINT' }))} color="emerald" />
                     <ResultPane title="Leaked Passwords" icon="fa-key" items={(currentResult.passwords || []).map(p => ({ val: p, meta: 'CREDENTIAL' }))} color="red" />
                     <ResultPane title="Admin Portals" icon="fa-door-open" items={(currentResult.adminLinks || []).map(a => ({ val: a, meta: 'INFRASTRUCTURE' }))} color="fuchsia" />
                     <ResultPane title="GSM Vectors" icon="fa-satellite" items={currentResult.phones.map(p => ({ val: p, meta: 'MOBILE_GATE' }))} color="blue" />
                     <ResultPane title="Detected Leaks" icon="fa-biohazard" items={currentResult.breaches.map(b => ({ val: b, meta: 'CRITICAL_SOURCE' }))} color="orange" />
                     <ResultPane title="Social Footprint" icon="fa-share-nodes" items={currentResult.socialMedia.map(s => ({ val: s, meta: 'PLATFORM_LINK' }))} color="purple" />
                     <ResultPane title="Messaging IDs" icon="fa-paper-plane" items={[...currentResult.telegram.map(t => ({ val: t, meta: 'TELEGRAM' })), ...currentResult.tiktok.map(t => ({ val: t, meta: 'TIKTOK' }))]} color="cyan" />
                     <ResultPane title="Scraped Assets" icon="fa-file-shield" items={currentResult.scrapedFiles?.map(f => ({ val: `${f.name}.${f.extension} (${f.size})`, meta: f.source })) || []} color="yellow" />
                  </div>

                  <div className="bg-[#050505] border border-white/5 p-4 rounded-lg">
                     <h3 className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                        <i className="fas fa-brain"></i> Neural Intelligence Summary
                     </h3>
                     <p className="text-[10px] text-gray-400 leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 py-1">
                        {currentResult.summary}
                     </p>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === AppTab.NETWORK && (
          <div className="space-y-4 animate-in">
             <div className="bg-[#050505] border border-white/5 p-6 rounded-lg shadow-2xl">
                <h3 className="text-xs font-black text-white uppercase italic tracking-tighter border-b border-white/5 pb-2 mb-4">Swarm Network Console V8.5 (800K Hybrid)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[7px] text-gray-500 uppercase font-black">Target Host</label>
                         <input type="text" value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="https://target.com" className="w-full bg-black border border-white/10 rounded px-4 py-2 text-fuchsia-500 font-mono outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[7px] text-gray-500 uppercase font-black">Methodology</label>
                            <select value={netConfig.method} onChange={(e) => setNetConfig({...netConfig, method: e.target.value})} className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white outline-none uppercase font-black text-[9px]">
                               {STRATEGIES[AppTab.NETWORK].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[7px] text-gray-500 uppercase font-black">Target Port</label>
                            <input type="number" value={netConfig.port} onChange={(e) => setNetConfig({...netConfig, port: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white outline-none" />
                         </div>
                      </div>

                      {netConfig.method.includes("SSH") && (
                         <div className="space-y-1 animate-in">
                            <label className="text-[7px] text-gray-500 uppercase font-black">SSH Username</label>
                            <input type="text" value={netConfig.sshUser} onChange={(e) => setNetConfig({...netConfig, sshUser: e.target.value})} className="w-full bg-black border border-white/10 rounded px-4 py-2 text-emerald-500 outline-none" />
                         </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[7px] text-gray-500 uppercase font-black">Threads</label>
                            <input type="number" value={netConfig.threads} onChange={(e) => setNetConfig({...netConfig, threads: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white outline-none" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[7px] text-gray-500 uppercase font-black">RPS / Rate</label>
                            <input type="number" value={netConfig.rateLimit} onChange={(e) => setNetConfig({...netConfig, rateLimit: parseInt(e.target.value)})} className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white outline-none" />
                         </div>
                      </div>
                   </div>

                   <div className="bg-black/30 border border-white/5 rounded p-6 flex flex-col items-center justify-center border-t-2 border-t-fuchsia-600">
                      <div className={`w-20 h-20 mb-4 rounded-full border-2 border-fuchsia-600/10 flex items-center justify-center relative ${isAttacking ? 'bg-fuchsia-600/10' : ''}`}>
                         <i className={`fas fa-bolt-lightning text-2xl ${isAttacking ? 'text-fuchsia-500 animate-bounce' : 'text-gray-800'}`}></i>
                         {isAttacking && <div className="absolute inset-0 border-2 border-fuchsia-500 border-t-transparent animate-spin"></div>}
                      </div>
                      <button onClick={isAttacking ? stopDdos : startDdos} className={`w-full py-2 rounded font-black text-[10px] uppercase transition-all shadow-xl ${isAttacking ? 'bg-white text-black' : 'bg-fuchsia-600 text-black hover:bg-fuchsia-500'}`}>
                         {isAttacking ? 'HALT_SESSION' : 'EXECUTE_STRESS_SWARM'}
                      </button>
                      {isAttacking && (
                         <div className="mt-4 space-y-1 text-center">
                            <p className="text-[8px] text-white uppercase font-black">Packets: {attackStats.packets.toLocaleString()}</p>
                            <p className="text-[8px] text-fuchsia-500 uppercase font-black animate-pulse">Load: EXTREME_OVERCLOCK</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === AppTab.ZXCDDOS && (
          <div className="space-y-4 animate-in h-full">
            <ZxCDDoS />
          </div>
        )}
        
        {activeTab === AppTab.IDE_TOOL && (
          <div className="h-full animate-in">
            <IdeTool />
          </div>
        )}

        {(activeTab === AppTab.SQL_INJECT || activeTab === AppTab.CMS_EXPLOIT) && (
          <SqlInject addLog={addLog} target={targetInput} />
        )}

        {activeTab === AppTab.BOTNET_CORE && (
          <BotnetCore addLog={addLog} isAttacking={isAttacking} />
        )}

        {activeTab === AppTab.KIMIKUKIU_TOOLS && (
          <KimikukiuTools addLog={addLog} target={targetInput} />
        )}

        {activeTab === AppTab.WHOAMISEC_GPT && !isGptMinimized && (
          <WhoamiGpt addLog={addLog} onMinimize={handleMinimizeGpt} openTerminal={() => setIsTerminalOpen(true)} />
        )}

        {activeTab === AppTab.MEDIA_CREATOR && (
          <MediaCreators addLog={addLog} />
        )}

        {activeTab === AppTab.SETTINGS && (
          <Settings netConfig={netConfig} setNetConfig={setNetConfig} addLog={addLog} />
        )}

        {activeTab === AppTab.QUANTUM_INTELLIGENCE && (
          <QuantumIntelligenceUltra />
        )}

        {activeTab === AppTab.AI_CONFIG && (
          <AIConfigPanel 
            config={aiConfig} 
            onConfigChange={handleAIConfigChange}
            addLog={addLog}
          />
        )}

        {activeTab === AppTab.GPT_TOOL && (
          <div className="h-full animate-in"><GptTool /></div>
        )}

        {activeTab === AppTab.SOLANA_TOOL && (
          <div className="h-full animate-in"><SolanaTool /></div>
        )}

        {activeTab === AppTab.DEPLOYER_TOOL && (
          <div className="h-full animate-in"><DeployerTool /></div>
        )}

        {activeTab === AppTab.SCANNER_TOOL && (
          <div className="h-full animate-in"><ScannerTool /></div>
        )}

        {activeTab === AppTab.S3_TOOL && (
          <div className="h-full animate-in"><S3Tool /></div>
        )}

        {activeTab === AppTab.BLACKHAT_TOOL && (
          <div className="h-full animate-in"><BlackhatTool /></div>
        )}

        {activeTab === AppTab.LAZARUS_TOOL && (
          <div className="h-full animate-in"><LazarusTool /></div>
        )}

        {activeTab === AppTab.BURPSUITE_TOOL && (
          <div className="h-full animate-in"><BurpSuiteTool /></div>
        )}

        {activeTab === AppTab.OWASP_TOOL && (
          <div className="h-full animate-in"><OwaspTool /></div>
        )}

        {activeTab === AppTab.LISP_AI_CONTROL && (
          <div className="h-full animate-in"><LispAiControl /></div>
        )}

        {activeTab === AppTab.LISP_CRYPTO && (
          <div className="h-full animate-in"><LispCryptoPanel /></div>
        )}

        {activeTab === AppTab.LISP_DATABASE && (
          <div className="h-full animate-in"><LispDatabasePanel /></div>
        )}

        {activeTab === AppTab.LISP_NEURAL && (
          <div className="h-full animate-in"><LispNeuralPanel /></div>
        )}

        {activeTab === AppTab.LISP_CISCO && (
          <div className="h-full animate-in"><LispCiscoPanel /></div>
        )}

        {activeTab === AppTab.LISP_CLISP && (
          <div className="h-full animate-in"><LispClispPanel /></div>
        )}

        {activeTab === AppTab.LISP_BREAKER && (
          <div className="h-full animate-in"><LispBreakerPanel /></div>
        )}

        {activeTab === AppTab.CYCORP_CYC && (
          <div className="h-full animate-in"><CycorpPanel /></div>
        )}

        {activeTab === AppTab.BOTNET_C2 && (
          <div className="h-full animate-in"><BotnetC2Panel /></div>
        )}

        {activeTab === AppTab.INVESTIGATION_AI && (
          <div className="h-full animate-in"><InvestigationAITool /></div>
        )}

        {activeTab === AppTab.OSINT_INVESTIGATION && (
          <div className="h-full animate-in"><OSINTInvestigationTool /></div>
        )}

        {activeTab === AppTab.ANDROID_INVESTIGATION && (
          <div className="h-full animate-in"><AndroidInvestigationTool /></div>
        )}

        {activeTab === AppTab.AWS_METADATA && (
          <div className="h-full animate-in"><AWSMetadataTool /></div>
        )}

        {activeTab === AppTab.FILE_DISCOVERY && (
          <div className="h-full animate-in"><FileDiscoveryTool /></div>
        )}

        {activeTab === AppTab.GPT_HUMAN && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="humanTransition" /></div>
        )}

        {activeTab === AppTab.GPT_PLAN && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="plan" /></div>
        )}

        {activeTab === AppTab.GPT_GEO && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="georeferencer" /></div>
        )}

        {activeTab === AppTab.GPT_AMOVEO && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="amoveo" /></div>
        )}

        {activeTab === AppTab.GPT_UAV && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="uav" /></div>
        )}

        {activeTab === AppTab.GPT_ICE && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="ice" /></div>
        )}

        {activeTab === AppTab.GPT_PALANTIR && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="palantir" /></div>
        )}

        {activeTab === AppTab.GPT_DRONES && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="drones" /></div>
        )}

        {activeTab === AppTab.GPT_BANK && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="bank" /></div>
        )}

        {activeTab === AppTab.GPT_QUANTUM_ARMY && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="quantum" /></div>
        )}

        {activeTab === AppTab.GPT_SOCIAL && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="social" /></div>
        )}

        {activeTab === AppTab.GPT_CCTV && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="cctv" /></div>
        )}

        {activeTab === AppTab.GPT_GHOST && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="ghost" /></div>
        )}

        {activeTab === AppTab.GPT_TV_HIJACK && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="tvbroadcast" /></div>
        )}

        {activeTab === AppTab.GPT_STS_BALLOT && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="ststelecom" /></div>
        )}

        {activeTab === AppTab.GPT_VEHICLES && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="vehicles" /></div>
        )}

        {activeTab === AppTab.GPT_AIRPORTS && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="airports" /></div>
        )}

        {activeTab === AppTab.GPT_METRO && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="metro" /></div>
        )}

        {activeTab === AppTab.GPT_BIOMETRIC && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="biometric" /></div>
        )}

        {activeTab === AppTab.GPT_SCADA && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="scada" /></div>
        )}

        {activeTab === AppTab.GPT_SS7 && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="ss7" /></div>
        )}

        {activeTab === AppTab.GPT_AEROSPACE && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="aerospace" /></div>
        )}

        {activeTab === AppTab.GPT_STARLINK && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="starlink" /></div>
        )}

        {activeTab === AppTab.GPT_JETS && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="militaryjets" /></div>
        )}

        {activeTab === AppTab.GPT_BANKING && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="banking" /></div>
        )}

        {activeTab === AppTab.GPT_POLICE && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="policeradio" /></div>
        )}

        {activeTab === AppTab.GPT_CODER && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="quantumcoder" /></div>
        )}

        {activeTab === AppTab.GPT_SPACEX && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="spacex" /></div>
        )}

        {activeTab === AppTab.GPT_PROMIS && (
          <div className="h-full animate-in"><GptModulePanel moduleKey="promis" /></div>
        )}

        {/* Terminal Popup Bubble */}
        <div className={`fixed bottom-20 right-4 w-80 md:w-96 h-80 z-40 bg-black/95 backdrop-blur border border-white/10 rounded-lg overflow-hidden shadow-2xl transition-all origin-bottom-right ${isTerminalOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
           <Terminal logs={logs} onClose={() => setIsTerminalOpen(false)} />
        </div>

        {/* Terminal Toggle Button */}
        <button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          className={`fixed bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] z-50 hover:scale-110 transition-all ${isTerminalOpen ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-emerald-600 text-black'}`}
          title="Toggle Terminal"
        >
          <i className={`fas ${isTerminalOpen ? 'fa-times' : 'fa-terminal'}`}></i>
        </button>

        {isGptMinimized && (
          <button 
            onClick={() => {
              setIsGptMinimized(false);
              handleSetActiveTab(AppTab.WHOAMISEC_GPT);
            }}
            className="fixed bottom-[108px] left-[185px] md:left-[365px] w-5 h-5 rounded-full bg-[#dc2626] border border-white/20 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.4)] animate-pulse hover:scale-110 transition-all z-[100]"
            title="Restore WHOAMISEC GPT"
          >
            <i className="fas fa-brain text-[8px] text-white"></i>
          </button>
        )}
      </main>

      {(isScanning) && (
        <div className="fixed inset-0 z-[600] bg-black/98 flex flex-col items-center justify-center">
           <div className="w-16 h-16 mb-4 relative">
              <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <i className="fas fa-skull text-white text-xl absolute inset-0 flex items-center justify-center animate-pulse"></i>
           </div>
           <h3 className="text-emerald-500 font-black text-xs uppercase italic animate-pulse tracking-[0.4em]">Shredding_Target_Metadata...</h3>
        </div>
      )}
    </div>
  );
};

const ResultPane = ({ title, icon, items, color }: { title: string, icon: string, items: any[], color: string }) => (
  <div className={`bg-[#050505] border border-white/5 rounded p-4 h-[280px] flex flex-col group hover:border-${color}-500/20 transition-all`}>
    <h4 className="text-[7px] font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-white/5 pb-1">
       <i className={`fas ${icon} text-${color}-500`}></i> {title}
    </h4>
    <div className="flex-1 overflow-y-auto custom-scroll space-y-1 pr-1">
      {items.length === 0 && <div className="py-20 text-center opacity-5 uppercase font-black text-[8px]">No_Data_Buffer</div>}
      {items.map((item, idx) => (
        <div key={idx} className="p-1.5 bg-black border border-white/5 rounded flex flex-col relative overflow-hidden group/item cursor-pointer">
           <div className={`absolute top-0 left-0 bottom-0 w-0.5 bg-${color}-500/20 group-hover/item:bg-${color}-500 transition-all`}></div>
           <span className="text-[5px] text-gray-700 font-black uppercase mb-0.5 tracking-widest">{item.meta}</span>
           <span className="text-[8px] text-gray-300 font-bold truncate group-hover/item:text-white transition-colors">{item.val}</span>
        </div>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <LoginGate>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/gpt-tool" element={<GptTool />} />
        <Route path="/ide-tool" element={<IdeTool />} />
        <Route path="/solana-tool" element={<SolanaTool />} />
        <Route path="/deployer-tool" element={<DeployerTool />} />
        <Route path="/quantum-tool" element={<QuantumTool />} />
        <Route path="/scanner-tool" element={<ScannerTool />} />
        <Route path="/s3-tool" element={<S3Tool />} />
        <Route path="/blackhat-tool" element={<BlackhatTool />} />
        <Route path="/lazarus-tool" element={<LazarusTool />} />
        <Route path="/burpsuite-tool" element={<BurpSuiteTool />} />
        <Route path="/owasp-tool" element={<OwaspTool />} />
      </Routes>
    </LoginGate>
  );
};

export default App;
