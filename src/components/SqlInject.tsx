
import React, { useState } from 'react';
import { LogEntry, Exploit, ExploitHistoryItem } from '../types';
import { generateLeakedData } from '../services/geminiService';

interface SqlInjectProps {
  addLog: (message: string, level: LogEntry['level']) => void;
  target: string;
}

const EXPLOITS: Exploit[] = [
  { name: 'Auto-Sqlmap (Neural)', severity: 'Critical', description: 'Autonomous SQL injection engine with neural-bypass for Cloudflare and reCAPTCHA.', type: 'SQLi' },
  { name: 'Neural Auth Bypass', severity: 'Critical', description: 'Bypasses authentication using neural-pattern matching on session tokens.', type: 'AuthBypass' },
  { name: 'Blind-Time Schema Crawler', severity: 'High', description: 'Extracts database schema using time-based blind SQL injection vectors.', type: 'SQLi' },
  { name: 'Universal Dumper', severity: 'Critical', description: 'Automated table dumping via multi-threaded union-based injection.', type: 'SQLi' },
  { name: '0-Day Payload Injector', severity: 'Critical', description: 'Injects proprietary 0-day payloads into vulnerable database endpoints.', type: 'RCE' },
];

const SqlInject: React.FC<SqlInjectProps> = ({ addLog, target }) => {
  const [selectedExploit, setSelectedExploit] = useState<Exploit | null>(null);
  const [isExploiting, setIsExploiting] = useState(false);
  const [history, setHistory] = useState<ExploitHistoryItem[]>([]);
  const [viewingResult, setViewingResult] = useState<ExploitHistoryItem | null>(null);

  const handleExploit = async () => {
    if (!target || !selectedExploit) return;
    
    setIsExploiting(true);
    addLog(`EXPLOIT_INIT: Launching ${selectedExploit.name} on ${target}...`, 'warning');
    
    try {
      const result = await generateLeakedData(target, selectedExploit.name);
      const historyItem: ExploitHistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        exploitName: selectedExploit.name,
        target,
        timestamp: new Date().toLocaleTimeString(),
        status: 'SUCCESS',
        leakedData: result
      };
      setHistory(prev => [historyItem, ...prev]);
      setViewingResult(historyItem);
      addLog(`EXPLOIT_OK: Successfully breached ${target}. Data extraction in progress.`, 'success');
    } catch (err) {
      addLog(`EXPLOIT_FAIL: Payload blocked by target firewall.`, 'error');
    } finally {
      setIsExploiting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-[#050505] border border-white/5 p-4 rounded-lg flex flex-col">
          <h3 className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Payload Selection</h3>
          <div className="space-y-2 flex-1 overflow-y-auto custom-scroll pr-1">
            {EXPLOITS.map(e => (
              <div 
                key={e.name} 
                onClick={() => setSelectedExploit(e)}
                className={`p-3 border rounded cursor-pointer transition-all ${selectedExploit?.name === e.name ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 hover:border-emerald-500/30'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-white uppercase">{e.name}</span>
                  <span className={`text-[6px] font-black px-1 rounded ${e.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}`}>{e.severity}</span>
                </div>
                <p className="text-[7px] text-gray-500 leading-tight">{e.description}</p>
              </div>
            ))}
          </div>
          <button 
            onClick={handleExploit} 
            disabled={isExploiting || !selectedExploit || !target}
            className={`mt-4 w-full py-2 rounded font-black text-[10px] uppercase transition-all ${isExploiting ? 'bg-white text-black' : 'bg-emerald-600 text-black hover:bg-emerald-500'}`}
          >
            {isExploiting ? 'INJECTING...' : 'LAUNCH_PAYLOAD'}
          </button>
        </div>

        <div className="lg:col-span-2 bg-[#050505] border border-white/5 p-4 rounded-lg flex flex-col min-h-[400px]">
          {viewingResult ? (
            <div className="flex flex-col h-full animate-in">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                <h3 className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em]">Extraction Result: {viewingResult.exploitName}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const csv = "id,username,email,passwordHash,role\n" + viewingResult.leakedData?.records.map(r => `${r.id},${r.username},${r.email},${r.passwordHash},${r.role}`).join("\n");
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `extraction_${viewingResult.id}.csv`;
                      a.click();
                      addLog("SQL_INJECT: Data exported to CSV.", "success");
                    }}
                    className="text-[7px] text-emerald-500 hover:text-white uppercase font-black px-2 py-1 border border-emerald-500/20 rounded"
                  >
                    Export_CSV
                  </button>
                  <button onClick={() => setViewingResult(null)} className="text-[7px] text-gray-500 hover:text-white uppercase font-black">Close_Buffer</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-black border border-white/5 p-3 rounded">
                  <span className="text-[6px] text-gray-600 uppercase font-black block mb-1">Database Name</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">{viewingResult.leakedData?.databaseName}</span>
                </div>
                <div className="bg-black border border-white/5 p-3 rounded">
                  <span className="text-[6px] text-gray-600 uppercase font-black block mb-1">Admin Panel</span>
                  <span className="text-[10px] text-blue-400 font-mono font-bold truncate">{viewingResult.leakedData?.adminPanelLink}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-2">
                <h4 className="text-[7px] font-black text-white uppercase mb-2">Extracted Records ({viewingResult.leakedData?.records.length})</h4>
                <div className="grid grid-cols-1 gap-1">
                  {viewingResult.leakedData?.records.map((r, i) => (
                    <div key={i} className="bg-black border border-white/5 p-2 rounded flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-white font-bold">{r.username}</span>
                        <span className="text-[6px] text-gray-600 font-mono">{r.email}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] text-emerald-500 font-mono">{r.passwordHash.substring(0, 15)}...</span>
                        <span className="text-[5px] text-gray-700 font-black uppercase">{r.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
              <i className="fas fa-database text-4xl mb-4"></i>
              <p className="text-[8px] font-black uppercase tracking-widest">Awaiting_Payload_Execution</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#050505] border border-white/5 p-4 rounded-lg">
        <h3 className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Breach History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[7px] text-gray-600 uppercase font-black">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Target</th>
                <th className="pb-2">Exploit</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-[8px]">
              {history.map(h => (
                <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2 text-gray-500">{h.timestamp}</td>
                  <td className="py-2 text-white font-bold">{h.target}</td>
                  <td className="py-2 text-emerald-500">{h.exploitName}</td>
                  <td className="py-2"><span className="px-1.5 py-0.5 bg-emerald-600/20 text-emerald-500 rounded border border-emerald-500/30">SUCCESS</span></td>
                  <td className="py-2">
                    <button onClick={() => setViewingResult(h)} className="text-white hover:text-emerald-500 transition-colors uppercase font-black text-[7px]">View_Data</button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-700 uppercase font-black">No_Breach_History_Buffer</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SqlInject;
