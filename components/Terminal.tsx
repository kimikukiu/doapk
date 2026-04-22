
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  onClose?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ logs, onClose }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#020202] rounded overflow-hidden flex flex-col h-full font-mono">
      <div className="bg-[#0a0a0a] px-2 py-1 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[7px] font-black text-gray-500 uppercase tracking-tighter italic">C2_MASTER_SESSION_800K</span>
          </div>
          <div id="terminal-restore-slot"></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[6px] text-gray-800 uppercase">System_Logged</span>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      <div className="p-1.5 text-[8px] overflow-y-auto flex-1 space-y-0.5 custom-scroll">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 border-b border-white/[0.02] last:border-0 py-0.5">
            <span className="text-gray-700 shrink-0">[{log.timestamp}]</span>
            <span className={`font-black uppercase shrink-0 ${
              log.level === 'success' ? 'text-emerald-600' : 
              log.level === 'error' ? 'text-red-600' : 
              log.level === 'warning' ? 'text-orange-600' : 
              log.level === 'critical' ? 'text-fuchsia-600' : 'text-blue-700'
            }`}>
              {log.level}
            </span>
            <span className="text-gray-500 break-all leading-tight">{log.message}</span>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default Terminal;
