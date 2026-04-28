
import React from 'react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  target?: string;
  isUp?: boolean;
  isAttacking?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, target = "NONE", isUp = true, isAttacking = false }) => {
  const menuItems = [
    { id: AppTab.DASHBOARD, label: 'Control Center', icon: 'fa-microchip' },
    { id: AppTab.QUANTUM_INTELLIGENCE, label: 'Quantum Intel', icon: 'fa-atom' },
    { id: AppTab.OSINT_DASHBOARD, label: 'OSINT Dashboard', icon: 'fa-globe' },
    { id: AppTab.EXTRACTOR, label: 'Deep Extractor', icon: 'fa-user-secret' },
    { id: AppTab.SQL_INJECT, label: 'Payload Vault', icon: 'fa-database' },
    { id: AppTab.NETWORK, label: 'Attack Console', icon: 'fa-satellite-dish' },
    { id: AppTab.ZXCDDOS, label: 'ZxCDDoS', icon: 'fa-bolt' },
    { id: AppTab.IDE_TOOL, label: 'Quantum IDE', icon: 'fa-code' },
    { id: AppTab.BOTNET_CORE, label: 'Zombie Swarm', icon: 'fa-users-rays' },
    { id: AppTab.KIMIKUKIU_TOOLS, label: 'Kimikukiu Repos', icon: 'fa-folder-tree' },
    { id: AppTab.WHOAMISEC_GPT, label: 'WHOAMISEC GPT', icon: 'fa-brain' },
    { id: AppTab.MEDIA_CREATOR, label: 'Media Forge', icon: 'fa-photo-film' },
    { id: AppTab.SETTINGS, label: 'Kernel Config', icon: 'fa-sliders' },
    { id: AppTab.TV_BROADCAST, label: 'TV Broadcast', icon: 'fa-broadcast-tower' },
    { id: AppTab.STS_TELECOM, label: 'STS Telecom', icon: 'fa-vote-yea' },
    { id: AppTab.GOLIATH_VEHICLES, label: 'Goliath Vehicles', icon: 'fa-car' },
    { id: AppTab.AIRPORT_CONTROL, label: 'Airport Control', icon: 'fa-plane' },
    { id: AppTab.METRO_TRAINS, label: 'Metro & Rail', icon: 'fa-train' },
    { id: AppTab.BIOMETRIC_RECON, label: 'Biometric Recon', icon: 'fa-fingerprint' },
    { id: AppTab.GLOBAL_SCADA, label: 'SCADA Infra', icon: 'fa-industry' },
    { id: AppTab.SS7_SIGNALS, label: 'SS7 & Jamming', icon: 'fa-tower-cell' },
    { id: AppTab.AEROSPACE_NAVAL, label: 'Air & Sea', icon: 'fa-jet-fighter' },
    { id: AppTab.STARLINK_PALANTIR, label: 'Starlink & Palantir', icon: 'fa-satellite' },
    { id: AppTab.MILITARY_JETS, label: 'Military Jets', icon: 'fa-fighter-jet' },
    { id: AppTab.GLOBAL_BANKING, label: 'Banks & Crypto', icon: 'fa-building-columns' },
    { id: AppTab.POLICE_RADIO, label: 'Police Radio', icon: 'fa-walkie-talkie' },
    { id: AppTab.QUANTUM_CODER, label: 'Quantum Coder', icon: 'fa-brain' },
    { id: AppTab.SPACEX_CONTROL, label: 'SpaceX Control', icon: 'fa-rocket' },
    { id: AppTab.PROMIS_CONTROL, label: 'PROMIS Intel', icon: 'fa-spider' },
    { id: AppTab.LISP_AI_CONTROL, label: 'LISP AI Crack', icon: 'fa-code' },
  ];

  const externalTools: { label: string; icon: string; url?: string; tab?: AppTab; color: string }[] = [
    { label: 'GPT CHAT', icon: 'fa-robot', url: '/gpt-tool', color: 'text-[#00ffc3]' },
    { label: 'IDE', icon: 'fa-laptop-code', url: '/ide-tool', color: 'text-[#ffaa00]' },
    { label: 'SOLANA', icon: 'fa-link', url: '/solana-tool', color: 'text-[#aa00ff]' },
    { label: 'DEPLOYER', icon: 'fa-rocket', url: '/deployer-tool', color: 'text-[#ff5e00]' },
    { label: 'QUANTUM', icon: 'fa-atom', url: '/quantum-tool', color: 'text-[#00ffff]' },
    { label: 'SCANNER', icon: 'fa-search', url: '/scanner-tool', color: 'text-[#ff00ff]' },
    { label: 'S3 BUCKETS', icon: 'fa-bucket', url: '/s3-tool', color: 'text-[#f59e0b]' },
    { label: 'BLACKHAT', icon: 'fa-user-ninja', url: '/blackhat-tool', color: 'text-[#ef4444]' },
    { label: 'LAZARUS APT', icon: 'fa-user-secret', url: '/lazarus-tool', color: 'text-[#991b1b]' },
    { label: 'BURPSUITE', icon: 'fa-spider', url: '/burpsuite-tool', color: 'text-[#ff6600]' },
    { label: 'OWASP ZAP', icon: 'fa-radar', url: '/owasp-tool', color: 'text-[#3b82f6]' },
    { label: 'QUANTUM CODER', icon: 'fa-brain', tab: AppTab.QUANTUM_CODER, color: 'text-[#00ffc3]' },
    { label: 'SPACEX CTRL', icon: 'fa-rocket', tab: AppTab.SPACEX_CONTROL, color: 'text-[#94a3b8]' },
    { label: 'POLICE RADIO', icon: 'fa-walkie-talkie', tab: AppTab.POLICE_RADIO, color: 'text-[#60a5fa]' },
    { label: 'MILITARY JETS', icon: 'fa-fighter-jet', tab: AppTab.MILITARY_JETS, color: 'text-[#a78bfa]' },
    { label: 'BANKS & CRYPTO', icon: 'fa-building-columns', tab: AppTab.GLOBAL_BANKING, color: 'text-[#34d399]' },
    { label: 'TV BROADCAST', icon: 'fa-broadcast-tower', tab: AppTab.TV_BROADCAST, color: 'text-[#fb923c]' },
    { label: 'STS TELECOM', icon: 'fa-vote-yea', tab: AppTab.STS_TELECOM, color: 'text-[#c084fc]' },
    { label: 'VEHICLES', icon: 'fa-car', tab: AppTab.GOLIATH_VEHICLES, color: 'text-[#fbbf24]' },
    { label: 'AIRPORTS', icon: 'fa-plane', tab: AppTab.AIRPORT_CONTROL, color: 'text-[#38bdf8]' },
    { label: 'METRO & RAIL', icon: 'fa-train', tab: AppTab.METRO_TRAINS, color: 'text-[#fb7185]' },
    { label: 'BIOMETRIC', icon: 'fa-fingerprint', tab: AppTab.BIOMETRIC_RECON, color: 'text-[#a3e635]' },
    { label: 'SCADA INFRA', icon: 'fa-industry', tab: AppTab.GLOBAL_SCADA, color: 'text-[#fca5a5]' },
    { label: 'SS7 & JAMMING', icon: 'fa-tower-cell', tab: AppTab.SS7_SIGNALS, color: 'text-[#67e8f9]' },
    { label: 'AIR & SEA', icon: 'fa-jet-fighter', tab: AppTab.AEROSPACE_NAVAL, color: 'text-[#c4b5fd]' },
    { label: 'STARLINK', icon: 'fa-satellite', tab: AppTab.STARLINK_PALANTIR, color: 'text-[#5eead4]' },
    { label: 'ZxCDDoS', icon: 'fa-bolt', tab: AppTab.ZXCDDOS, color: 'text-[#f472b6]' },
    { label: 'BOTNET CORE', icon: 'fa-users-rays', tab: AppTab.BOTNET_CORE, color: 'text-[#d946ef]' },
    { label: 'MEDIA FORGE', icon: 'fa-photo-film', tab: AppTab.MEDIA_CREATOR, color: 'text-[#fb923c]' },
    { label: 'PROMIS INTEL', icon: 'fa-spider', tab: AppTab.PROMIS_CONTROL, color: 'text-[#e879f9]' },
    { label: 'LISP AI CRACK', icon: 'fa-code', tab: AppTab.LISP_AI_CONTROL, color: 'text-[#4ade80]' },
  ];

  return (
    <aside className="w-16 md:w-56 bg-[#050505] border-r border-emerald-500/10 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl transition-all">
      <div className="p-3 flex items-center justify-center md:justify-start gap-2 border-b border-white/5 mb-2 shrink-0">
        <div className={`w-8 h-8 rounded flex items-center justify-center shadow-xl ring-1 transition-all ${isAttacking ? 'bg-fuchsia-600 ring-fuchsia-400 animate-pulse' : 'bg-emerald-500 ring-emerald-400/50'}`}>
          <i className={`fas ${isAttacking ? 'fa-bolt-lightning' : 'fa-skull'} text-black text-sm`}></i>
        </div>
        <div className="hidden md:block flex flex-col">
          <span className="font-black text-xs tracking-tighter text-white uppercase italic leading-none">WHOAMISec</span>
          <span className={`text-[7px] font-black uppercase tracking-widest ${isAttacking ? 'text-fuchsia-500' : 'text-emerald-500'}`}>PRO_V8.5</span>
        </div>
      </div>

      {/* Scrollable menu items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto custom-scroll min-h-0">
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
      </nav>

      {/* EXTERNAL TOOLS — pinned at bottom, always visible */}
      <div className="shrink-0 border-t border-emerald-500/20 bg-[#050505]">
        <div className="hidden md:block px-3 pt-2 pb-1">
          <span className="text-[6px] text-emerald-500 font-black uppercase tracking-widest">EXTERNAL TOOLS</span>
        </div>
        <div className="max-h-[35vh] overflow-y-auto custom-scroll">
          {externalTools.map((tool) => (
            <button
              key={tool.label}
              onClick={() => tool.tab ? setActiveTab(tool.tab) : window.open(tool.url, '_blank')}
              className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-1.5 transition-all group relative hover:bg-white/5 ${tool.tab && activeTab === tool.tab ? 'bg-white/5 border-r-2 border-emerald-500' : 'text-gray-500'}`}
            >
              <i className={`fas ${tool.icon} text-sm w-5 transition-transform group-hover:scale-110 ${tool.color}`}></i>
              <span className={`hidden md:block font-black uppercase text-[7px] tracking-[0.15em] ${tool.color} opacity-80 group-hover:opacity-100`}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

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
