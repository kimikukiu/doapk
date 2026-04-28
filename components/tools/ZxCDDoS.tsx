import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTerminal, faPlay, faStop, faGlobe, faShieldAlt, faNetworkWired, faBolt, faFire, faBomb, faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { useLocalStorage } from '../../src/hooks/useLocalStorage';

export const ZxCDDoS: React.FC = () => {
  const [target, setTarget] = useLocalStorage('zx_target', '');
  const [port, setPort] = useLocalStorage('zx_port', '80');
  const [method, setMethod] = useLocalStorage('zx_method', 'HTTP-GET');
  const [threads, setThreads] = useLocalStorage('zx_threads', '1000');
  const [time, setTime] = useLocalStorage('zx_time', '60');
  const [power, setPower] = useLocalStorage('zx_power', 'EXTREME');
  const [isRunning, setIsRunning] = useLocalStorage('zx_isRunning', false);
  const [logs, setLogs] = useLocalStorage<string[]>('zx_logs', []);
  const [endTime, setEndTime] = useLocalStorage('zx_endTime', 0);
  const [packetsSent, setPacketsSent] = useState(0);
  const [bandwidthUsed, setBandwidthUsed] = useState(0);
  const [targetStatus, setTargetStatus] = useState<'STABLE' | 'STRESSED' | 'CRITICAL' | 'DOWN'>('STABLE');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const methods = [
    'HTTP-GET', 'HTTP-POST', 'HTTP-MIX', 'HTTP-RAW', 'HTTP-SOCKET',
    'TCP-KILL', 'TCP-SYN', 'TCP-ACK', 'TCP-FIN', 'TCP-RST',
    'UDP-FLOOD', 'UDP-BYPASS', 'DNS-AMP', 'NTP-AMP', 'MEMCACHED-AMP'
  ];

  const powerLevels = ['STANDARD', 'HIGH', 'EXTREME', 'NUCLEAR', 'QUANTUM'];

  const getPowerMultiplier = () => {
    switch (power) {
      case 'NUCLEAR': return 5;
      case 'QUANTUM': return 10;
      case 'EXTREME': return 3;
      case 'HIGH': return 1.5;
      default: return 1;
    }
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleStart = () => {
    if (!target) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [CRITICAL] Target is required. Specify target host to annihilate.`]);
      return;
    }
    const newEndTime = Date.now() + parseInt(time) * 1000;
    setEndTime(newEndTime);
    setIsRunning(true);
    setPacketsSent(0);
    setBandwidthUsed(0);
    setTargetStatus('STABLE');
    const powerMult = getPowerMultiplier();
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [NUCLEAR] ZxCDDoS Quantum Engine v9.0 - Initializing...`,
      `[${new Date().toLocaleTimeString()}] [POWER] Mode: ${power} (${powerMult}x Multiplier)`,
      `[${new Date().toLocaleTimeString()}] [TARGET] Locked: ${target}:${port}`,
      `[${new Date().toLocaleTimeString()}] [METHOD] ${method} - Optimized payload`,
      `[${new Date().toLocaleTimeString()}] [THREADS] ${threads} parallel streams`,
      `[${new Date().toLocaleTimeString()}] [DURATION] ${time}s saturation window`,
      `[${new Date().toLocaleTimeString()}] [ARMED] Attack vectors armed - Ready to unleash`,
      `[${new Date().toLocaleTimeString()}] [FIRE] >> EXECUTING <<`
    ]);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTargetStatus('STABLE');
    setLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [HALTED] Attack sequence terminated by operator`,
      `[${new Date().toLocaleTimeString()}] [STATS] Total packets: ${packetsSent.toLocaleString()} | Bandwidth: ${(bandwidthUsed / 1024 / 1024 / 1024).toFixed(2)} GB`
    ]);
  };

  useEffect(() => {
    let interval: any;
    let timeout: any;
    let statsInterval: any;

    if (isRunning) {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        setIsRunning(false);
        setTargetStatus('STABLE');
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [COMPLETE] Attack sequence finished. Target neutralized.`]);
      } else {
        const powerMult = getPowerMultiplier();
        const basePackets = parseInt(threads) * 100 * powerMult;

        // Attack logs interval
        interval = setInterval(() => {
          setLogs(prev => {
            const newLogs = [...prev];
            if (newLogs.length > 200) newLogs.shift();
            const statuses = ['200 OK', '503 UNAVAILABLE', '502 BAD_GATEWAY', '408 TIMEOUT', 'CRITICAL_HIT'];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const payload = Math.floor(Math.random() * 65535);
            newLogs.push(`[${new Date().toLocaleTimeString()}] [${method}] Payload:${payload} -> ${target}:${port} - Status: ${status}`);
            return newLogs;
          });
        }, 100);

        // Stats tracking interval
        statsInterval = setInterval(() => {
          setPacketsSent(prev => prev + Math.floor(basePackets * 10));
          setBandwidthUsed(prev => prev + Math.floor(basePackets * 1500));
          
          // Update target status based on attack duration
          const elapsed = Date.now() - (endTime - parseInt(time) * 1000);
          const progress = elapsed / (parseInt(time) * 1000);
          if (progress > 0.8) setTargetStatus('DOWN');
          else if (progress > 0.6) setTargetStatus('CRITICAL');
          else if (progress > 0.3) setTargetStatus('STRESSED');
        }, 1000);

        timeout = setTimeout(() => {
          setIsRunning(false);
          setTargetStatus('STABLE');
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [COMPLETE] Attack window expired.`]);
        }, remaining);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
      if (statsInterval) clearInterval(statsInterval);
    };
  }, [isRunning, endTime, method, target, port, threads, time, power]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
        <h2 className="text-xl font-bold text-red-500 flex items-center uppercase tracking-tighter">
          <FontAwesomeIcon icon={faBolt} className="mr-3 animate-pulse" />
          ZxCDDoS v5.0
        </h2>
        <div className="flex items-center space-x-4">
          {isRunning && (
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-1 px-4 rounded uppercase transition-all shadow-[0_0_10px_rgba(220,38,38,0.5)]"
            >
              <FontAwesomeIcon icon={faStop} className="mr-2" />
              Emergency Stop
            </button>
          )}
          <div className="flex items-center space-x-2 text-[10px] text-gray-500 uppercase font-bold">
            <FontAwesomeIcon icon={faShieldAlt} className="text-green-500" />
            <span>Stealth: Active</span>
          </div>
        </div>
      </div>

      {isRunning ? (
        /* Enhanced Running View with Power Effects */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
          {/* Stats Panel */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-black/90 border border-red-500/50 rounded p-4 shadow-[0_0_30px_rgba(220,38,38,0.3)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent pointer-events-none" />
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-600/10 rounded-full blur-2xl animate-pulse" />
              
              <h3 className="text-[10px] font-black text-red-500 uppercase mb-3 tracking-widest flex items-center">
                <FontAwesomeIcon icon={faBomb} className="mr-2" />
                Attack Status
              </h3>
              
              <div className="space-y-3 relative z-10">
                <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
                  <span className="text-[8px] text-red-400 uppercase block">Target Status</span>
                  <span className={`text-sm font-black ${
                    targetStatus === 'DOWN' ? 'text-red-600' :
                    targetStatus === 'CRITICAL' ? 'text-orange-500' :
                    targetStatus === 'STRESSED' ? 'text-yellow-500' : 'text-green-500'
                  } animate-pulse`}>{targetStatus}</span>
                </div>

                <div className="bg-black/50 border border-white/10 rounded p-2">
                  <span className="text-[8px] text-gray-500 uppercase block">TARGET</span>
                  <span className="text-[11px] text-white font-bold truncate">{target}:{port}</span>
                </div>

                <div className="bg-black/50 border border-white/10 rounded p-2">
                  <span className="text-[8px] text-gray-500 uppercase block">METHOD</span>
                  <span className="text-[11px] text-fuchsia-500 font-bold">{method}</span>
                </div>

                <div className="bg-black/50 border border-white/10 rounded p-2">
                  <span className="text-[8px] text-gray-500 uppercase block">POWER</span>
                  <span className="text-[11px] text-red-500 font-bold">{power}</span>
                </div>

                <div className="bg-black/50 border border-white/10 rounded p-2">
                  <span className="text-[8px] text-gray-500 uppercase block">PACKETS SENT</span>
                  <span className="text-[14px] text-white font-black font-mono">{packetsSent.toLocaleString()}</span>
                </div>

                <div className="bg-black/50 border border-white/10 rounded p-2">
                  <span className="text-[8px] text-gray-500 uppercase block">BANDWIDTH</span>
                  <span className="text-[14px] text-blue-400 font-black font-mono">{(bandwidthUsed / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-red-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] text-red-400 uppercase">Target Saturation</span>
                  <FontAwesomeIcon icon={faFire} className="text-red-500 animate-pulse" />
                </div>
                <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse transition-all duration-500"
                    style={{ 
                      width: targetStatus === 'DOWN' ? '100%' : 
                             targetStatus === 'CRITICAL' ? '85%' : 
                             targetStatus === 'STRESSED' ? '60%' : '30%' 
                    }}
                  />
                </div>
                <p className="text-[8px] text-center text-red-500 mt-1 animate-pulse font-black uppercase">
                  {targetStatus === 'DOWN' ? 'TARGET NEUTRALIZED' : 'SATURATING CAPACITY...'}
                </p>
              </div>
            </div>

            <button
              onClick={handleStop}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-3 px-4 rounded uppercase transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faStop} className="mr-2" />
              Emergency Stop
            </button>
          </div>
          
          {/* Enhanced Console */}
          <div className="md:col-span-3 bg-black border border-red-500/30 rounded flex flex-col h-[400px] shadow-[0_0_30px_rgba(220,38,38,0.15)]">
            <div className="bg-gradient-to-r from-red-900/30 to-black px-4 py-2 flex items-center justify-between border-b border-red-500/30">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCrosshairs} className="text-red-500 animate-pulse" />
                <span className="text-[10px] text-red-400 font-black uppercase">Live Attack Stream</span>
                <span className="text-[8px] text-gray-500 uppercase">|</span>
                <span className="text-[8px] text-fuchsia-400 font-black">{method}</span>
                <span className="text-[8px] text-blue-400 font-black">{threads} Threads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-red-500 animate-pulse font-black">● EXECUTING</span>
                <span className="text-[8px] text-gray-500 uppercase font-bold">POWER: {power}</span>
              </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[9px] custom-scrollbar space-y-0.5">
              {logs.slice(-25).map((log, index) => {
                const isHit = log.includes('CRITICAL_HIT') || log.includes('503') || log.includes('502');
                const isError = log.includes('CRITICAL') || log.includes('ERROR');
                return (
                  <div 
                    key={index} 
                    className={`${
                      isError ? 'text-red-500 font-bold' : 
                      isHit ? 'text-yellow-400 font-bold animate-pulse' :
                      log.includes('[NUCLEAR]') ? 'text-red-400 font-bold' :
                      log.includes('[POWER]') ? 'text-orange-400' :
                      log.includes('[FIRE]') ? 'text-red-500 font-black' :
                      log.includes('[STATS]') ? 'text-blue-400' :
                      'text-green-500/80'
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-red-500 animate-pulse">▶</span>
                <span className="text-red-500/50">_</span>
              </div>
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      ) : (
        /* Full Config View when idle */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-1 bg-gray-900/40 border border-white/5 rounded-lg p-5">
            <h3 className="text-xs font-black text-white mb-4 flex items-center uppercase tracking-widest">
              <FontAwesomeIcon icon={faNetworkWired} className="mr-2 text-blue-400" />
              Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Target Host</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faGlobe} className="text-gray-600 text-xs" />
                  </div>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded py-2 pl-9 pr-3 text-white text-xs focus:outline-none focus:border-red-500 transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded py-2 px-3 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Time (s)</label>
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded py-2 px-3 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded py-2 px-3 text-white text-xs focus:outline-none focus:border-red-500 appearance-none"
                >
                  {methods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Power Level</label>
                <select
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  className={`w-full bg-black border rounded py-2 px-3 text-xs focus:outline-none appearance-none font-black ${
                    power === 'QUANTUM' ? 'border-purple-500 text-purple-400' :
                    power === 'NUCLEAR' ? 'text-red-500 border-red-500' :
                    power === 'EXTREME' ? 'text-orange-500 border-orange-500' :
                    power === 'HIGH' ? 'text-yellow-500 border-yellow-500' :
                    'text-gray-400 border-white/10'
                  }`}
                >
                  {powerLevels.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-[7px] text-gray-600 mt-1">
                  {power === 'QUANTUM' && '⚠️ 10x Multiplier - Maximum Devastation'}
                  {power === 'NUCLEAR' && '⚠️ 5x Multiplier - Extreme Force'}
                  {power === 'EXTREME' && '3x Multiplier - Heavy Impact'}
                  {power === 'HIGH' && '1.5x Multiplier - Enhanced Power'}
                  {power === 'STANDARD' && 'Standard attack strength'}
                </p>
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Threads</label>
                <input
                  type="number"
                  value={threads}
                  onChange={(e) => setThreads(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded py-2 px-3 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStart}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 rounded uppercase transition-all flex items-center justify-center shadow-lg hover:shadow-red-600/20"
                >
                  <FontAwesomeIcon icon={faPlay} className="mr-2" />
                  Initiate Attack
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-black border border-white/5 rounded-lg flex flex-col overflow-hidden">
            <div className="bg-gray-900/50 border-b border-white/5 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center text-gray-500 text-[10px] font-black uppercase">
                <FontAwesomeIcon icon={faTerminal} className="mr-2" />
                Console
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-[9px] text-gray-600 hover:text-white transition-colors uppercase font-bold"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] custom-scrollbar min-h-[300px]">
              {logs.length === 0 ? (
                <div className="text-gray-700 italic">Awaiting command sequence...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`${
                        log.includes('[ERROR]') ? 'text-red-500' : 
                        log.includes('[INFO]') ? 'text-blue-500' : 
                        'text-green-500/70'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
