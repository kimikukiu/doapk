
import React from 'react';
import { AppTab, NetworkConfig } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  target?: string;
  isUp?: boolean;
  isAttacking?: boolean;
  netConfig?: NetworkConfig;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, target = "NONE", isUp = true, isAttacking = false, netConfig }) => {
  const menuItems = [
    { id: AppTab.DASHBOARD, label: 'Control Center', icon: 'fa-microchip' },
    { id: AppTab.QUANTUM_INTELLIGENCE, label: 'Quantum Intel', icon: 'fa-atom' },
    { id: AppTab.OSINT_DASHBOARD, label: 'OSINT Dashboard', icon: 'fa-globe' },
    { id: AppTab.GPT_PALANTIR, label: 'PALANTIR Intel', icon: 'fa-eye' },
    { id: AppTab.EXTRACTOR, label: 'Deep Extractor', icon: 'fa-user-secret' },
    { id: AppTab.SQL_INJECT, label: 'Payload Vault', icon: 'fa-database' },
    { id: AppTab.CMS_EXPLOIT, label: 'CMS Exploit', icon: 'fa-shield-virus' },
    { id: AppTab.NETWORK, label: 'Attack Console', icon: 'fa-satellite-dish' },
    { id: AppTab.ZXCDDOS, label: 'ZxCDDoS', icon: 'fa-bolt' },
    { id: AppTab.IDE_TOOL, label: 'Quantum IDE', icon: 'fa-code' },
    { id: AppTab.BOTNET_CORE, label: 'Zombie Swarm', icon: 'fa-users-rays' },
    { id: AppTab.KIMIKUKIU_TOOLS, label: 'Kimikukiu Repos', icon: 'fa-folder-tree' },
    { id: AppTab.WHOAMISEC_GPT, label: 'WHOAMISEC GPT', icon: 'fa-brain' },
    { id: AppTab.MEDIA_CREATOR, label: 'Media Forge', icon: 'fa-photo-film' },
    { id: AppTab.AI_CONFIG, label: 'AI Config', icon: 'fa-robot' },
    { id: AppTab.GPT_HUMAN, label: 'Human Transition', icon: 'fa-user-shield' },
    { id: AppTab.GPT_PLAN, label: 'Strategic Plan', icon: 'fa-map' },
    { id: AppTab.GPT_GEO, label: 'Georeferencer', icon: 'fa-map-marker-alt' },
    { id: AppTab.GPT_AMOVEO, label: 'AMOVEO Kill Chain', icon: 'fa-crosshairs' },
    { id: AppTab.GPT_UAV, label: 'UAV Counter-Intel', icon: 'fa-drone' },
    { id: AppTab.GPT_ICE, label: 'ICE Command', icon: 'fa-snowflake' },
    { id: AppTab.GPT_DRONES, label: 'Combat Drones', icon: 'fa-fighter-jet' },
    { id: AppTab.GPT_QUANTUM_ARMY, label: 'Quantum Army', icon: 'fa-atom' },
    { id: AppTab.GPT_CCTV, label: 'GOLIATH CCTV', icon: 'fa-video' },
    { id: AppTab.GPT_SCADA, label: 'SCADA Infra', icon: 'fa-industry' },
    { id: AppTab.GPT_AEROSPACE, label: 'Aerospace / Naval', icon: 'fa-jet-fighter' },
    { id: AppTab.GPT_JETS, label: 'Military Jets', icon: 'fa-fighter-jet' },
    { id: AppTab.GPT_CODER, label: 'Quantum Coder', icon: 'fa-brain' },
    { id: AppTab.INVESTIGATION_AI, label: 'Investigation AI', icon: 'fa-search' },
    { id: AppTab.OSINT_INVESTIGATION, label: 'OSINT Engine', icon: 'fa-globe-americas' },
    { id: AppTab.ANDROID_INVESTIGATION, label: 'Android Forensics', icon: 'fa-mobile-alt' },
    { id: AppTab.AWS_METADATA, label: 'AWS Metadata', icon: 'fab fa-aws' },
    { id: AppTab.FILE_DISCOVERY, label: 'File Discovery', icon: 'fa-folder-open' },
  ];

  const toolItems = [
    { id: AppTab.GPT_TOOL, label: 'GPT Chat', icon: 'fa-robot', color: 'text-[#00ffc3]' },
    { id: AppTab.SOLANA_TOOL, label: 'Solana Tool', icon: 'fa-link', color: 'text-[#aa00ff]' },
    { id: AppTab.DEPLOYER_TOOL, label: 'Deployer', icon: 'fa-rocket', color: 'text-[#ff5e00]' },
    { id: AppTab.SCANNER_TOOL, label: 'Scanner', icon: 'fa-search', color: 'text-[#ff00ff]' },
    { id: AppTab.S3_TOOL, label: 'S3 Buckets', icon: 'fa-bucket', color: 'text-[#f59e0b]' },
    { id: AppTab.BLACKHAT_TOOL, label: 'Blackhat', icon: 'fa-user-ninja', color: 'text-[#ef4444]' },
    { id: AppTab.LAZARUS_TOOL, label: 'Lazarus APT', icon: 'fa-user-secret', color: 'text-[#991b1b]' },
    { id: AppTab.BURPSUITE_TOOL, label: 'BurpSuite', icon: 'fa-spider', color: 'text-[#ff6600]' },
    { id: AppTab.OWASP_TOOL, label: 'OWASP ZAP', icon: 'fa-shield-halved', color: 'text-[#3b82f6]' },
    { id: AppTab.GPT_POLICE, label: 'Police Radio', icon: 'fa-walkie-talkie', color: 'text-blue-400' },
    { id: AppTab.GPT_BANK, label: 'Bank Takeover', icon: 'fa-university', color: 'text-emerald-400' },
    { id: AppTab.GPT_SOCIAL, label: 'Social Takeover', icon: 'fa-users-cog', color: 'text-pink-400' },
    { id: AppTab.GPT_GHOST, label: 'Ghost Wallet', icon: 'fa-ghost', color: 'text-lime-400' },
    { id: AppTab.GPT_TV_HIJACK, label: 'TV Broadcast', icon: 'fa-broadcast-tower', color: 'text-rose-400' },
    { id: AppTab.GPT_STS_BALLOT, label: 'STS Ballot', icon: 'fa-vote-yea', color: 'text-violet-400' },
    { id: AppTab.GPT_VEHICLES, label: 'Vehicle Takeover', icon: 'fa-car', color: 'text-amber-400' },
    { id: AppTab.GPT_AIRPORTS, label: 'Airport Control', icon: 'fa-plane', color: 'text-sky-400' },
    { id: AppTab.GPT_METRO, label: 'Metro / Rail', icon: 'fa-train', color: 'text-teal-400' },
    { id: AppTab.GPT_BIOMETRIC, label: 'Biometric Recon', icon: 'fa-fingerprint', color: 'text-pink-400' },
    { id: AppTab.GPT_SS7, label: 'SS7 Signals', icon: 'fa-tower-cell', color: 'text-lime-400' },
    { id: AppTab.GPT_STARLINK, label: 'Starlink Control', icon: 'fa-satellite', color: 'text-violet-400' },
    { id: AppTab.GPT_BANKING, label: 'Banks & Crypto', icon: 'fa-building-columns', color: 'text-emerald-400' },
    { id: AppTab.GPT_SPACEX, label: 'SpaceX Orbital', icon: 'fa-rocket', color: 'text-white' },
    { id: AppTab.GPT_PROMIS, label: 'PROMIS Octopus', icon: 'fa-spider', color: 'text-fuchsia-400' },
    { id: AppTab.BOTNET_C2, label: 'Botnet C2', icon: 'fa-skull-crossbones', color: 'text-red-500' },
    { id: AppTab.SETTINGS, label: 'Kernel Config', icon: 'fa-sliders', color: 'text-gray-400' },
  ];

  const lispItems = [
    { id: AppTab.LISP_AI_CONTROL, label: 'LISP AI Control', icon: 'fa-terminal', color: 'text-[#00ff88]' },
    { id: AppTab.LISP_CRYPTO, label: 'Crypto Engine', icon: 'fa-lock', color: 'text-[#fbbf24]' },
    { id: AppTab.LISP_DATABASE, label: 'SQL Database', icon: 'fa-database', color: 'text-[#60a5fa]' },
    { id: AppTab.LISP_NEURAL, label: 'Neural Net / ML', icon: 'fa-brain', color: 'text-[#c084fc]' },
    { id: AppTab.LISP_CISCO, label: 'Cisco LISP', icon: 'fa-network-wired', color: 'text-[#22d3ee]' },
    { id: AppTab.LISP_CLISP, label: 'CLISP Exploit', icon: 'fa-file-code', color: 'text-[#fb923c]' },
    { id: AppTab.LISP_BREAKER, label: 'AI DNA Breaker', icon: 'fa-skull-crossbones', color: 'text-[#f87171]' },
    { id: AppTab.CYCORP_CYC, label: 'Cycorp CYC KB', icon: 'fa-atom', color: 'text-[#2dd4bf]' },
  ];

  return (
    <aside className="w-16 md:w-56 bg-[#050505] border-r border-emerald-500/10 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl transition-all overflow-y-auto custom-scroll">
      <div className="p-3 flex items-center justify-center md:justify-start gap-2 border-b border-white/5 mb-2 shrink-0">
        <div className={`w-8 h-8 rounded flex items-center justify-center shadow-xl ring-1 transition-all ${isAttacking ? 'bg-fuchsia-600 ring-fuchsia-400 animate-pulse' : 'bg-emerald-500 ring-emerald-400/50'}`}>
          <i className={`fas ${isAttacking ? 'fa-bolt-lightning' : 'fa-skull'} text-black text-sm`}></i>
        </div>
        <div className="hidden md:block flex flex-col">
          <span className="font-black text-xs tracking-tighter text-white uppercase italic leading-none">WHOAMISec</span>
          <span className={`text-[7px] font-black uppercase tracking-widest ${isAttacking ? 'text-fuchsia-500' : 'text-emerald-500'}`}>PRO_V8.5</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 transition-all group relative ${
              activeTab === item.id 
                ? 'bg-emerald-500/10 text-emerald-400 border-r-2 border-emerald-500' 
                : 'text-gray-600 hover:text-emerald-400 hover:bg-white/5'
            }`}
          >
            <i className={`fas ${item.icon} text-sm w-5 transition-transform group-hover:scale-110`}></i>
            <span className="hidden md:block font-black uppercase text-[8px] tracking-[0.2em]">{item.label}</span>
          </button>
        ))}

        <div className="hidden md:block px-3 pt-4 pb-1">
          <span className="text-[6px] text-gray-600 font-black uppercase tracking-widest">SOFTWARE TOOLS</span>
        </div>
        
        {toolItems.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTab(tool.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 transition-all group relative ${
              activeTab === tool.id 
                ? `bg-white/5 border-r-2 border-r-current ${tool.color}` 
                : 'text-gray-600 hover:bg-white/5'
            }`}
          >
            <i className={`fas ${tool.icon} text-sm w-5 transition-transform group-hover:scale-110 ${activeTab === tool.id ? tool.color : 'group-hover:' + tool.color}`}></i>
            <span className={`hidden md:block font-black uppercase text-[8px] tracking-[0.2em] ${activeTab === tool.id ? tool.color : 'opacity-60 group-hover:opacity-100 ' + tool.color}`}>{tool.label}</span>
          </button>
        ))}

        <div className="hidden md:block px-3 pt-4 pb-1">
          <span className="text-[6px] text-green-600 font-black uppercase tracking-widest">LISP ENGINE</span>
        </div>
        
        {lispItems.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTab(tool.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 transition-all group relative ${
              activeTab === tool.id 
                ? `bg-white/5 border-r-2 border-r-current ${tool.color}` 
                : 'text-gray-600 hover:bg-white/5'
            }`}
          >
            <i className={`fas ${tool.icon} text-sm w-5 transition-transform group-hover:scale-110 ${activeTab === tool.id ? tool.color : 'group-hover:' + tool.color}`}></i>
            <span className={`hidden md:block font-black uppercase text-[8px] tracking-[0.2em] ${activeTab === tool.id ? tool.color : 'opacity-60 group-hover:opacity-100 ' + tool.color}`}>{tool.label}</span>
          </button>
        ))}

      </nav>

      <div className="p-2 border-t border-white/5 hidden md:block shrink-0">
        <div className={`bg-black p-2.5 rounded-lg border transition-all ${isAttacking ? 'border-fuchsia-600/30' : 'border-emerald-500/10'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[6px] text-gray-600 font-black uppercase tracking-widest">Swarm Link</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-600 animate-pulse'}`}></div>
          </div>
          <div className="flex flex-col gap-1">
             <p className="text-[8px] text-white font-mono font-bold truncate uppercase tracking-tighter">{target}</p>
             <div className="flex justify-between items-center border-t border-white/5 pt-1">
                <span className={`text-[7px] font-black uppercase ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isUp ? 'STABLE' : 'OFFLINE'}
                </span>
                {isAttacking && (
                  <span className="text-[6px] font-black text-fuchsia-500 uppercase animate-bounce">800K_LOAD</span>
                )}
             </div>
             {isAttacking && (
               <div className="mt-1 bg-black/60 p-1.5 rounded border border-white/5">
                  <div className="w-full bg-white/5 h-0.5 rounded-full overflow-hidden">
                     <div className="h-full bg-fuchsia-600" style={{ width: '100%' }}></div>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
