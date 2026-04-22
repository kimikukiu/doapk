
import React from 'react';
import { LogEntry, NetworkConfig } from '../types';

interface SettingsProps {
  netConfig: NetworkConfig;
  setNetConfig: (config: NetworkConfig) => void;
  addLog: (message: string, level: LogEntry['level']) => void;
}

const Settings: React.FC<SettingsProps> = ({ netConfig, setNetConfig, addLog }) => {
  const handleChange = (field: keyof NetworkConfig, value: any) => {
    setNetConfig({ ...netConfig, [field]: value });
  };

  const handleSave = () => {
    addLog("KERNEL: Configuration saved to local buffer.", "success");
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-white/5 p-6 rounded-lg shadow-2xl">
        <h3 className="text-xs font-black text-white uppercase italic tracking-tighter border-b border-white/5 pb-2 mb-4">Kernel Configuration V8.5</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-[8px] font-black text-emerald-500 uppercase tracking-widest border-l-2 border-emerald-500 pl-2">Swarm Parameters</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[7px] text-gray-500 uppercase font-black">Power Level</label>
                  <select 
                    value={netConfig.powerLevel} 
                    onChange={(e) => handleChange('powerLevel', e.target.value)}
                    className="w-full bg-black border border-white/10 rounded p-2 text-white outline-none uppercase font-black text-[9px]"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Turbo">Turbo</option>
                    <option value="Critical">Critical</option>
                    <option value="EXTREME_OVERCLOCK">EXTREME_OVERCLOCK</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] text-gray-500 uppercase font-black">Payload Size (Bytes)</label>
                  <input 
                    type="number" 
                    value={netConfig.payloadSize} 
                    onChange={(e) => handleChange('payloadSize', parseInt(e.target.value))}
                    className="w-full bg-black border border-white/10 rounded p-2 text-white outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-black border border-white/5 rounded">
                <span className="text-[8px] text-gray-400 uppercase font-black">Header Jitter</span>
                <input 
                  type="checkbox" 
                  checked={netConfig.headerJitter} 
                  onChange={(e) => handleChange('headerJitter', e.target.checked)}
                  className="accent-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between p-2 bg-black border border-white/5 rounded">
                <span className="text-[8px] text-gray-400 uppercase font-black">Proxy Scrape Automation</span>
                <input 
                  type="checkbox" 
                  checked={netConfig.proxyScrape} 
                  onChange={(e) => handleChange('proxyScrape', e.target.checked)}
                  className="accent-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[8px] font-black text-blue-500 uppercase tracking-widest border-l-2 border-blue-500 pl-2">Advanced Neural Config</h4>
              <div className="space-y-1">
                <label className="text-[7px] text-gray-500 uppercase font-black">Neural Visitor Emulation Rate</label>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={netConfig.rateLimit} 
                  onChange={(e) => handleChange('rateLimit', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[6px] text-gray-600 font-black">
                  <span>STEALTH</span>
                  <span>{netConfig.rateLimit}%</span>
                  <span>AGGRESSIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-black/50 border border-white/5 p-4 rounded-lg">
              <h4 className="text-[8px] font-black text-white uppercase tracking-widest mb-4">System Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[7px] text-gray-600 uppercase font-black">Version</span>
                  <span className="text-[7px] text-emerald-500 font-black">8.5.0-PRO-STABLE</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[7px] text-gray-600 uppercase font-black">Build Date</span>
                  <span className="text-[7px] text-white font-black">2026-03-06</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[7px] text-gray-600 uppercase font-black">Neural Core</span>
                  <span className="text-[7px] text-white font-black">GHOST-GPT-V4</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[7px] text-gray-600 uppercase font-black">License Status</span>
                  <span className="text-[7px] text-emerald-500 font-black">LIFETIME_ENTERPRISE</span>
                </div>
              </div>
            </div>

            <div className="p-4 border border-emerald-500/20 rounded-lg bg-emerald-500/5">
              <p className="text-[7px] text-emerald-400 leading-relaxed italic">
                "WHOAMISec Pro utilizes a decentralized neural mesh of 800,000 nodes to provide 100% visitor acceptance. All traffic is masked via residential proxy rotation and browser fingerprint emulation."
              </p>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-3 bg-emerald-600 text-black rounded font-black text-[10px] uppercase hover:bg-emerald-500 transition-all shadow-xl"
            >
              Save_Kernel_Config
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
