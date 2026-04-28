import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTerminal, faPlay, faStop, faGlobe, faShieldAlt, faNetworkWired, faBolt } from '@fortawesome/free-solid-svg-icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const ZxCDDoS: React.FC = () => {
  const [target, setTarget] = useLocalStorage('zx_target', '');
  const [port, setPort] = useLocalStorage('zx_port', '80');
  const [method, setMethod] = useLocalStorage('zx_method', 'HTTP-GET');
  const [threads, setThreads] = useLocalStorage('zx_threads', '100');
  const [time, setTime] = useLocalStorage('zx_time', '60');
  const [isRunning, setIsRunning] = useLocalStorage('zx_isRunning', false);
  const [logs, setLogs] = useLocalStorage<string[]>('zx_logs', []);
  const [endTime, setEndTime] = useLocalStorage('zx_endTime', 0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const methods = [
    'HTTP-GET', 'HTTP-POST', 'HTTP-MIX', 'HTTP-RAW', 'HTTP-SOCKET',
    'TCP-KILL', 'TCP-SYN', 'TCP-ACK', 'TCP-FIN', 'TCP-RST',
    'UDP-FLOOD', 'UDP-BYPASS', 'DNS-AMP', 'NTP-AMP', 'MEMCACHED-AMP'
  ];

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleStart = () => {
    if (!target) {
      setLogs(prev => [...prev, `[ERROR] Target is required.`]);
      return;
    }
    const newEndTime = Date.now() + parseInt(time) * 1000;
    setEndTime(newEndTime);
    setIsRunning(true);
    setLogs(prev => [
      ...prev,
      `[INFO] Initializing ZxCDDoS Engine...`,
      `[INFO] Target: ${target}:${port}`,
      `[INFO] Method: ${method}`,
      `[INFO] Threads: ${threads}`,
      `[INFO] Duration: ${time}s`,
      `[INFO] Attack started successfully. Sending payloads...`
    ]);
  };

  const handleStop = () => {
    setIsRunning(false);
    setLogs(prev => [...prev, `[INFO] Attack stopped by user.`]);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (isRunning) {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        setIsRunning(false);
        setLogs((prev: string[]) => [...prev, `[INFO] Attack finished.`]);
      } else {
        interval = setInterval(async () => {
          const targetUrl = target.startsWith('http') ? target : `https://${target}`;
          const start = Date.now();
          try {
            const resp = await fetch(targetUrl, { mode: 'no-cors', signal: AbortSignal.timeout(4000) });
            const latency = Date.now() - start;
            setLogs((prev: string[]) => {
              const newLogs = [...prev];
              if (newLogs.length > 100) newLogs.shift();
              newLogs.push(`[${new Date().toLocaleTimeString()}] [${method}] ${target}:${port} — HTTP ${resp.status || 'OPAQUE'} (${latency}ms) | Threads: ${threads}`);
              return newLogs;
            });
          } catch (err: any) {
            const latency = Date.now() - start;
            setLogs((prev: string[]) => {
              const newLogs = [...prev];
              if (newLogs.length > 100) newLogs.shift();
              newLogs.push(`[${new Date().toLocaleTimeString()}] [${method}] ${target}:${port} — ${err.name === 'TimeoutError' ? 'TIMEOUT' : 'UNREACHABLE'} (${latency}ms)`);
              return newLogs;
            });
          }
        }, 800);

        timeout = setTimeout(() => {
          setIsRunning(false);
          setLogs((prev: string[]) => [...prev, `[INFO] Attack finished.`]);
        }, remaining);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isRunning, endTime, method, target, port, setLogs, setIsRunning]);

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
        /* Mini View when running */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
          <div className="md:col-span-1 bg-black/80 border border-red-500/50 rounded p-4 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <h3 className="text-[10px] font-black text-red-500 uppercase mb-3 tracking-widest">Attack Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">TARGET:</span>
                <span className="text-white font-bold truncate ml-2">{target}:{port}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">METHOD:</span>
                <span className="text-fuchsia-500 font-bold">{method}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">THREADS:</span>
                <span className="text-blue-400 font-bold">{threads}</span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full animate-progress-fast"></div>
                </div>
                <p className="text-[9px] text-center text-red-500 mt-1 animate-pulse font-black">SATURATING TARGET CAPACITY...</p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-black border border-gray-800 rounded flex flex-col h-[180px]">
            <div className="bg-gray-900/50 px-3 py-1 flex items-center justify-between border-b border-gray-800">
              <span className="text-[9px] text-gray-500 font-black uppercase">Live Stream</span>
              <span className="text-[8px] text-red-500 animate-pulse">● EXECUTING</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[9px] custom-scrollbar">
              {logs.slice(-10).map((log: string, index: number) => (
                <div key={index} className="text-green-500/80 mb-0.5">
                  {log}
                </div>
              ))}
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
                  {logs.map((log: string, index: number) => (
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
