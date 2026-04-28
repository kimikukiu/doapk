import React, { useState, useRef, useEffect } from 'react';
import { exploitService, ExploitResult, Vulnerability } from '../../src/services/exploitService';

export default function BlackhatTool() {
  const [target, setTarget] = useState('');
  const [selectedExploit, setSelectedExploit] = useState<string>('auto_exploit');
  const [isAttacking, setIsAttacking] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'BLACKHAT EXPLOIT FRAMEWORK V2.0 initialized.',
    'WARNING: For authorized penetration testing only.',
    'Real exploit engine ready - no simulations.'
  ]);
  const [results, setResults] = useState<ExploitResult[]>([]);
  const [lhost, setLhost] = useState('192.168.1.100');
  const [lport, setLport] = useState('4444');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (msg: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = level === 'success' ? '[+]' : level === 'error' ? '[!]' : level === 'warning' ? '[*]' : '[*]';
    setLogs(prev => [...prev, `${timestamp} ${prefix} ${msg}`]);
  };

  const startAttack = async () => {
    if (!target) {
      alert('Please enter a target IP or domain.');
      return;
    }

    setIsAttacking(true);
    setResults([]);
    addLog(`Initiating exploit: ${selectedExploit} on ${target}`, 'warning');

    try {
      let result: ExploitResult;

      switch (selectedExploit) {
        case 'auto_exploit':
          addLog('Running comprehensive exploit suite...', 'info');
          const autoResults = await exploitService.autoExploit(target);
          setResults(autoResults);
          addLog(`Auto-exploit complete. ${autoResults.filter(r => r.status === 'success').length} successful.`, 'success');
          break;

        case 'apache_path_traversal':
          addLog('Testing Apache 2.4.49 path traversal...', 'info');
          result = await exploitService.apachePathTraversal(target);
          setResults([result]);
          if (result.status === 'success') {
            addLog('Apache path traversal vulnerability confirmed!', 'success');
          }
          break;

        case 'log4j_rce':
          addLog('Testing Log4j remote code execution...', 'info');
          result = await exploitService.log4jRCE(target, lhost);
          setResults([result]);
          if (result.status === 'success') {
            addLog('Log4j RCE vulnerability confirmed!', 'success');
          }
          break;

        case 'sql_injection':
          addLog('Testing SQL injection vulnerabilities...', 'info');
          result = await exploitService.sqlInjection(target);
          setResults([result]);
          if (result.status === 'success') {
            addLog('SQL injection vulnerability confirmed!', 'success');
          }
          break;

        case 'directory_traversal':
          addLog('Testing directory traversal...', 'info');
          result = await exploitService.directoryTraversal(target);
          setResults([result]);
          if (result.status === 'success') {
            addLog('Directory traversal vulnerability confirmed!', 'success');
          }
          break;

        case 'xss':
          addLog('Testing XSS vulnerabilities...', 'info');
          result = await exploitService.xssExploit(target);
          setResults([result]);
          if (result.status === 'success') {
            addLog('XSS vulnerability confirmed!', 'success');
          }
          break;

        case 'port_scan':
          addLog('Performing port scan...', 'info');
          result = await exploitService.portScan(target);
          setResults([result]);
          addLog('Port scan complete.', 'success');
          break;

        default:
          addLog('Unknown exploit type.', 'error');
          return;
      }

      exploitService.addResult(result!);

    } catch (error: any) {
      addLog(`Attack failed: ${error.message}`, 'error');
    } finally {
      setIsAttacking(false);
    }
  };

  const generatePayload = (type: string) => {
    let payload = '';
    
    switch (type) {
      case 'metasploit':
        payload = exploitService.generateMetasploitPayload(lhost, parseInt(lport));
        break;
      case 'python':
        payload = exploitService.generatePythonShell(lhost, parseInt(lport));
        break;
      case 'bash':
        payload = exploitService.generateBashShell(lhost, parseInt(lport));
        break;
      default:
        payload = 'Unknown payload type';
    }

    addLog(`Generated ${type} payload:`, 'info');
    addLog(payload, 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addLog('Copied to clipboard', 'success');
    });
  };

  const clearResults = () => {
    exploitService.clearResults();
    setResults([]);
    addLog('Results cleared', 'info');
  };

  const exportResults = () => {
    const data = exploitService.exportResults();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackhat_exploit_results_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Results exported', 'success');
  };

  const vulnerabilities = exploitService.getVulnerabilities();

  return (
    <div className="p-4 space-y-4 bg-black border border-red-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-red-400 uppercase tracking-tighter">
          <i className="fas fa-skull-crossbones mr-2"></i>BLACKHAT EXPLOIT FRAMEWORK
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isAttacking ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {isAttacking ? 'ATTACKING' : 'READY'}
          </span>
        </div>
      </div>

      {/* Target Configuration */}
      <div className="bg-black/40 border border-red-900/20 rounded p-3">
        <label className="text-red-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-crosshairs mr-1"></i>Target Configuration
        </label>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target IP or domain..."
          className="w-full bg-black border border-red-900/30 rounded px-3 py-2 text-red-400 font-mono text-sm outline-none focus:border-red-500/50 mb-2"
        />
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-red-400 text-xs font-black uppercase block mb-1">LHOST</label>
            <input
              type="text"
              value={lhost}
              onChange={e => setLhost(e.target.value)}
              placeholder="192.168.1.100"
              className="w-full bg-black border border-red-900/30 rounded px-2 py-1 text-red-400 font-mono text-xs outline-none focus:border-red-500/50"
            />
          </div>
          <div>
            <label className="text-red-400 text-xs font-black uppercase block mb-1">LPORT</label>
            <input
              type="text"
              value={lport}
              onChange={e => setLport(e.target.value)}
              placeholder="4444"
              className="w-full bg-black border border-red-900/30 rounded px-2 py-1 text-red-400 font-mono text-xs outline-none focus:border-red-500/50"
            />
          </div>
        </div>
      </div>

      {/* Exploit Selection */}
      <div className="bg-black/40 border border-red-900/20 rounded p-3">
        <label className="text-red-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-bomb mr-1"></i>Exploit Selection
        </label>
        <select
          value={selectedExploit}
          onChange={e => setSelectedExploit(e.target.value)}
          className="w-full bg-black border border-red-900/30 rounded px-3 py-2 text-red-400 font-mono text-sm outline-none focus:border-red-500/50"
        >
          <option value="auto_exploit">Auto Exploit (All)</option>
          <option value="apache_path_traversal">Apache 2.4.49 Path Traversal</option>
          <option value="log4j_rce">Log4j Remote Code Execution</option>
          <option value="sql_injection">SQL Injection</option>
          <option value="directory_traversal">Directory Traversal</option>
          <option value="xss">Cross-Site Scripting (XSS)</option>
          <option value="port_scan">Port Scanning</option>
        </select>
        
        <button
          onClick={startAttack}
          disabled={isAttacking || !target}
          className="mt-3 w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
        >
          {isAttacking ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>Attacking...
            </>
          ) : (
            <>
              <i className="fas fa-rocket mr-1"></i>Launch Exploit
            </>
          )}
        </button>
      </div>

      {/* Payload Generation */}
      <div className="bg-black/40 border border-red-900/20 rounded p-3">
        <label className="text-red-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-code mr-1"></i>Payload Generation
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => generatePayload('metasploit')}
            className="py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all"
          >
            Metasploit
          </button>
          <button
            onClick={() => generatePayload('python')}
            className="py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded transition-all"
          >
            Python
          </button>
          <button
            onClick={() => generatePayload('bash')}
            className="py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all"
          >
            Bash
          </button>
        </div>
      </div>

      {/* Vulnerabilities */}
      <div className="bg-black/40 border border-red-900/20 rounded p-3">
        <label className="text-red-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-bug mr-1"></i>Available Vulnerabilities
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {vulnerabilities.map((vuln, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div>
                <span className="text-red-400 font-bold">{vuln.cve}</span>
                <span className="text-gray-400 ml-2">{vuln.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                vuln.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                vuln.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                vuln.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {vuln.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-black/40 border border-red-900/20 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-red-400 text-xs font-black uppercase block">
              <i className="fas fa-chart-bar mr-1"></i>Exploit Results
            </label>
            <div className="flex gap-2">
              <button
                onClick={exportResults}
                className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30"
              >
                <i className="fas fa-download mr-1"></i>Export
              </button>
              <button
                onClick={clearResults}
                className="px-2 py-1 bg-red-600/20 border border-red-600 text-red-400 text-xs rounded hover:bg-red-600/30"
              >
                <i className="fas fa-trash mr-1"></i>Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`bg-black/60 border rounded p-2 ${
                result.status === 'success' ? 'border-green-900/20' : 
                result.status === 'failed' ? 'border-yellow-900/20' : 
                'border-red-900/20'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-red-400 font-bold text-xs">{result.exploit}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    result.status === 'success' ? 'bg-green-500/20 text-green-400' : 
                    result.status === 'failed' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-xs text-gray-400 mb-1">
                  Target: {result.target} | {result.timestamp.toLocaleTimeString()}
                </div>
                
                {result.command && (
                  <div className="mb-1">
                    <span className="text-gray-500 text-xs">Command:</span>
                    <code className="text-green-400 text-xs ml-1">{result.command}</code>
                    <button
                      onClick={() => copyToClipboard(result.command!)}
                      className="ml-2 px-1 py-0.5 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                )}
                
                {result.output && (
                  <div className="bg-black/80 border border-red-900/10 rounded p-1">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {result.output.length > 500 ? result.output.substring(0, 500) + '...' : result.output}
                    </pre>
                  </div>
                )}
                
                {result.error && (
                  <div className="text-red-400 text-xs">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-red-900/20 rounded p-3">
        <label className="text-red-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-terminal mr-1"></i>System Logs
        </label>
        <div
          ref={messagesEndRef}
          className="bg-black/60 border border-red-900/10 rounded p-2 h-32 overflow-y-auto font-mono text-xs text-gray-400"
        >
          {logs.length === 0 ? (
            <div className="text-gray-600">No logs yet...</div>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
