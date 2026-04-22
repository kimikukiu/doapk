
import React, { useState, useEffect } from 'react';
import { LogEntry, BotNode } from '../types';

interface BotnetCoreProps {
  addLog: (message: string, level: LogEntry['level']) => void;
  isAttacking: boolean;
}

const BOT_LOCATIONS: BotNode[] = [
  { id: 'WHOAMI-US-CLUSTER', country: 'United States', status: 'ONLINE', latency: 28, uptime: '45d', type: 'SERVER' },
  { id: 'WHOAMI-EU-CLUSTER', country: 'European Union', status: 'ONLINE', latency: 34, uptime: '112d', type: 'SERVER' },
  { id: 'WHOAMI-AS-CLUSTER', country: 'Asia Pacific', status: 'BUSY', latency: 110, uptime: '12d', type: 'IOT' },
  { id: 'WHOAMI-RU-CLUSTER', country: 'Russia/CIS', status: 'ONLINE', latency: 85, uptime: '89d', type: 'SERVER' },
  { id: 'WHOAMI-BR-CLUSTER', country: 'South America', status: 'ONLINE', latency: 140, uptime: '5d', type: 'IOT' },
  { id: 'WHOAMI-ME-CLUSTER', country: 'Middle East', status: 'ONLINE', latency: 95, uptime: '31d', type: 'DESKTOP' },
  { id: 'WHOAMI-AF-CLUSTER', country: 'Africa', status: 'ONLINE', latency: 120, uptime: '18d', type: 'IOT' },
  { id: 'WHOAMI-OC-CLUSTER', country: 'Oceania', status: 'ONLINE', latency: 76, uptime: '67d', type: 'SERVER' },
];

const BotnetCore: React.FC<BotnetCoreProps> = ({ addLog, isAttacking }) => {
  const [nodes, setNodes] = useState<BotNode[]>(BOT_LOCATIONS);
  const [totalNodes, setTotalNodes] = useState(850000);
  const [activeConnections, setActiveConnections] = useState(42500);
  const [packetsPerSecond, setPacketsPerSecond] = useState(0);
  const [swarmIntensity, setSwarmIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalNodes(prev => {
        const change = Math.floor(Math.random() * 500) - 250;
        return Math.max(800000, prev + change);
      });
      setNodes(prev => prev.map(n => ({
        ...n,
        latency: Math.max(10, n.latency + Math.floor(Math.random() * 20) - 10),
        status: Math.random() > 0.95 ? 'BUSY' : 'ONLINE'
      })));
      
      if (isAttacking) {
        setActiveConnections(prev => 40000 + Math.floor(Math.random() * 10000));
        setPacketsPerSecond(prev => 2500000 + Math.floor(Math.random() * 500000));
        setSwarmIntensity(prev => Math.min(100, prev + 5));
      } else {
        setActiveConnections(prev => Math.max(1000, prev - 500));
        setPacketsPerSecond(0);
        setSwarmIntensity(0);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isAttacking]);

  const getIntensityColor = () => {
    if (swarmIntensity > 80) return 'text-red-500';
    if (swarmIntensity > 50) return 'text-orange-500';
    if (swarmIntensity > 20) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getIntensityBg = () => {
    if (swarmIntensity > 80) return 'bg-red-500';
    if (swarmIntensity > 50) return 'bg-orange-500';
    if (swarmIntensity > 20) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#050505] border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center border-t-2 border-t-emerald-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <span className="text-[7px] text-gray-600 uppercase font-black tracking-widest mb-1 relative z-10">Total Swarm Nodes</span>
          <span className="text-2xl font-black text-white italic tracking-tighter relative z-10">{totalNodes.toLocaleString()}</span>
          <span className="text-[6px] text-emerald-500 font-black uppercase mt-1 animate-pulse relative z-10">850K+ HYBRID MESH ACTIVE</span>
        </div>
        
        <div className="bg-[#050505] border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center border-t-2 border-t-fuchsia-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent pointer-events-none" />
          {isAttacking && <div className="absolute inset-0 bg-fuchsia-500/10 animate-pulse pointer-events-none" />}
          <span className="text-[7px] text-gray-600 uppercase font-black tracking-widest mb-1 relative z-10">Current Load</span>
          <span className={`text-2xl font-black italic tracking-tighter relative z-10 ${isAttacking ? 'text-fuchsia-500' : 'text-white'}`}>
            {isAttacking ? `${(swarmIntensity).toFixed(1)}%` : '0.2%'}
          </span>
          <span className="text-[6px] text-gray-500 font-black uppercase mt-1 relative z-10">
            {isAttacking ? 'SWARM AT MAXIMUM CAPACITY' : 'Standby Mode'}
          </span>
        </div>
        
        <div className="bg-[#050505] border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center border-t-2 border-t-blue-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <span className="text-[7px] text-gray-600 uppercase font-black tracking-widest mb-1 relative z-10">Active Connections</span>
          <span className="text-2xl font-black text-white italic tracking-tighter relative z-10">{activeConnections.toLocaleString()}</span>
          <span className="text-[6px] text-blue-500 font-black uppercase mt-1 relative z-10">LIVE CONNECTIONS</span>
        </div>
        
        <div className={`bg-[#050505] border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center border-t-2 ${isAttacking ? 'border-t-red-500' : 'border-t-gray-500'} relative overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-b ${isAttacking ? 'from-red-500/10' : 'from-gray-500/5'} to-transparent pointer-events-none`} />
          {isAttacking && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />}
          <span className="text-[7px] text-gray-600 uppercase font-black tracking-widest mb-1 relative z-10">Packets/Second</span>
          <span className={`text-2xl font-black italic tracking-tighter relative z-10 ${isAttacking ? 'text-red-500' : 'text-white'}`}>
            {isAttacking ? `${(packetsPerSecond / 1000000).toFixed(2)}M` : '0'}
          </span>
          <span className={`text-[6px] font-black uppercase mt-1 relative z-10 ${isAttacking ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
            {isAttacking ? 'SATURATION FIRE' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Swarm Intensity Bar */}
      {isAttacking && (
        <div className="bg-[#050505] border border-white/5 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Swarm Intensity</span>
            <span className={`text-[8px] font-black uppercase ${getIntensityColor()}`}>{swarmIntensity.toFixed(1)}% SATURATION</span>
          </div>
          <div className="w-full bg-gray-900 h-3 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-1000 ${getIntensityBg()} ${isAttacking ? 'animate-pulse' : ''}`}
              style={{ width: `${swarmIntensity}%` }}
            />
            {isAttacking && (
              <>
                <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Swarm Distribution Matrix */}
      <div className="bg-[#050505] border border-white/5 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em]">Global Swarm Distribution Matrix</h3>
          {isAttacking && (
            <span className="text-[8px] font-black text-red-500 uppercase animate-pulse">
              ⚠️ COORDINATED STRIKE IN PROGRESS
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {nodes.map((node, index) => (
            <div 
              key={node.id} 
              className={`bg-black border p-3 rounded flex items-center gap-4 transition-all duration-300 ${
                isAttacking 
                  ? 'border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                  : 'border-white/5 hover:border-emerald-500/30'
              }`}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className={`w-12 h-12 rounded border flex items-center justify-center transition-all duration-300 ${
                isAttacking 
                  ? 'bg-red-600/20 border-red-500 text-red-500 shadow-[0_0_20px_#dc2626] animate-pulse' 
                  : node.status === 'BUSY' 
                    ? 'bg-orange-600/10 border-orange-500 text-orange-500' 
                    : 'bg-emerald-600/10 border-emerald-900 text-emerald-500'
              }`}>
                <i className={`fas ${node.type === 'SERVER' ? 'fa-server' : node.type === 'IOT' ? 'fa-microchip' : 'fa-desktop'} text-lg`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[9px] font-black text-white uppercase truncate">{node.id}</h4>
                  <span className={`text-[6px] font-black px-1.5 py-0.5 rounded ${
                    isAttacking 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : node.status === 'ONLINE' 
                        ? 'bg-emerald-600 text-black' 
                        : 'bg-orange-600 text-black'
                  }`}>
                    {isAttacking ? 'ATTACKING' : node.status}
                  </span>
                </div>
                <div className="flex justify-between text-[7px] text-gray-600 font-bold uppercase">
                  <span>{node.country}</span>
                  <span className={`${isAttacking ? 'text-red-400' : 'text-blue-500'}`}>{node.latency} ms</span>
                </div>
                <div className="mt-2 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isAttacking 
                        ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600' 
                        : 'bg-emerald-500'
                    }`} 
                    style={{ width: isAttacking ? `${90 + Math.random() * 10}%` : '5%' }}
                  />
                </div>
                {isAttacking && (
                  <div className="mt-1 flex justify-between text-[6px] text-red-400 font-black uppercase">
                    <span>Load: 98%</span>
                    <span>TX: {(Math.random() * 1000).toFixed(0)} Mbps</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Neural Mesh Commands */}
      <div className="bg-[#050505] border border-white/5 p-4 rounded-lg">
        <h3 className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Neural Mesh Command Center</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button onClick={() => addLog("SWARM_CMD: Synchronizing 850K heartbeat cycles...", "warning")} 
            className={`bg-black border p-2 rounded text-[7px] text-white font-black uppercase transition-all ${
              isAttacking ? 'border-red-500/50 hover:bg-red-600 hover:text-white' : 'border-white/10 hover:bg-emerald-600 hover:text-black'
            }`}>
            <i className="fas fa-sync-alt mr-1"></i> Sync_Heartbeat
          </button>
          <button onClick={() => addLog("SWARM_CMD: Rotating residential proxy mesh...", "warning")} 
            className={`bg-black border p-2 rounded text-[7px] text-white font-black uppercase transition-all ${
              isAttacking ? 'border-red-500/50 hover:bg-red-600 hover:text-white' : 'border-white/10 hover:bg-emerald-600 hover:text-black'
            }`}>
            <i className="fas fa-network-wired mr-1"></i> Rotate_Proxies
          </button>
          <button onClick={() => addLog("SWARM_CMD: Purging stale nodes and recruiting new...", "warning")} 
            className={`bg-black border p-2 rounded text-[7px] text-white font-black uppercase transition-all ${
              isAttacking ? 'border-red-500/50 hover:bg-red-600 hover:text-white' : 'border-white/10 hover:bg-emerald-600 hover:text-black'
            }`}>
            <i className="fas fa-broom mr-1"></i> Purge_Stale
          </button>
          <button onClick={() => addLog("SWARM_CMD: Amplifying neural visitor emulation...", "warning")} 
            className={`bg-black border p-2 rounded text-[7px] text-white font-black uppercase transition-all ${
              isAttacking ? 'border-red-500/50 hover:bg-red-600 hover:text-white' : 'border-white/10 hover:bg-emerald-600 hover:text-black'
            }`}>
            <i className="fas fa-brain mr-1"></i> Scale_Neural
          </button>
        </div>
      </div>

      {/* Attack Visualization */}
      {isAttacking && (
        <div className="bg-[#050505] border border-red-500/30 p-4 rounded-lg">
          <h3 className="text-[8px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 flex items-center">
            <i className="fas fa-crosshairs mr-2 animate-pulse"></i>
            Active Attack Visualization
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/50 border border-white/10 rounded p-3">
              <div className="text-[8px] text-gray-500 uppercase mb-1">Request Rate</div>
              <div className="text-lg font-black text-red-500 font-mono">
                {(packetsPerSecond / 1000).toFixed(0)}K
                <span className="text-[8px] text-gray-500">/sec</span>
              </div>
              <div className="mt-2 h-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-red-500 animate-pulse" style={{ width: '85%' }} />
              </div>
            </div>
            <div className="bg-black/50 border border-white/10 rounded p-3">
              <div className="text-[8px] text-gray-500 uppercase mb-1">Success Rate</div>
              <div className="text-lg font-black text-orange-500 font-mono">
                {(85 + Math.random() * 10).toFixed(1)}%
              </div>
              <div className="mt-2 h-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: '92%' }} />
              </div>
            </div>
            <div className="bg-black/50 border border-white/10 rounded p-3">
              <div className="text-[8px] text-gray-500 uppercase mb-1">Active Nodes</div>
              <div className="text-lg font-black text-fuchsia-500 font-mono">
                {(totalNodes / 1000).toFixed(0)}K
              </div>
              <div className="mt-2 h-1 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-fuchsia-500 animate-pulse" style={{ width: '98%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotnetCore;
