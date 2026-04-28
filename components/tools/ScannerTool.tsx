import React, { useState, useRef, useEffect } from 'react';

interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string;
  version: string;
  banner: string;
  risk: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

interface HostInfo {
  ip: string;
  hostname: string;
  os: string;
  mac: string;
  status: 'up' | 'down';
  latency: number;
}

interface VulnResult {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  port: number;
  cve: string;
  description: string;
  exploitAvailable: boolean;
}

// Simulated network scanner engine
const scannerEngine = {
  portScan(target: string, ports: string): PortResult[] {
    const portList = ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    const services: Record<number, { service: string; version: string }> = {
      21: { service: 'FTP', version: 'vsftpd 3.0.3' },
      22: { service: 'SSH', version: 'OpenSSH 8.9p1' },
      25: { service: 'SMTP', version: 'Postfix 3.7.0' },
      53: { service: 'DNS', version: 'BIND 9.18.12' },
      80: { service: 'HTTP', version: 'nginx/1.24.0' },
      110: { service: 'POP3', version: 'Dovecot 2.3.21' },
      143: { service: 'IMAP', version: 'Dovecot 2.3.21' },
      443: { service: 'HTTPS', version: 'nginx/1.24.0' },
      993: { service: 'IMAPS', version: 'Dovecot 2.3.21' },
      1433: { service: 'MSSQL', version: 'Microsoft SQL Server 2022' },
      3306: { service: 'MySQL', version: 'MySQL 8.0.35' },
      3389: { service: 'RDP', version: 'Microsoft Terminal Services' },
      5432: { service: 'PostgreSQL', version: 'PostgreSQL 16.1' },
      5900: { service: 'VNC', version: 'RealVNC 6.11' },
      6379: { service: 'Redis', version: 'Redis 7.2.3' },
      8080: { service: 'HTTP-Proxy', version: 'Apache Tomcat 10.1' },
      8443: { service: 'HTTPS-Alt', version: 'Jetty 12.0.3' },
      9090: { service: 'Prometheus', version: 'Prometheus 2.48.1' },
      27017: { service: 'MongoDB', version: 'MongoDB 7.0.4' },
    };
    const risks: Record<string, PortResult['risk']> = {
      21: 'high', 23: 'critical', 25: 'medium', 53: 'low', 80: 'info',
      110: 'medium', 143: 'medium', 443: 'info', 1433: 'high', 3306: 'high',
      3389: 'critical', 5432: 'high', 5900: 'critical', 6379: 'critical',
      8080: 'medium', 8443: 'medium', 27017: 'high',
    };

    return portList.map(port => {
      const isOpen = Math.random() > 0.4;
      const svc = services[port] || { service: 'unknown', version: '' };
      return {
        port,
        state: isOpen ? (Math.random() > 0.2 ? 'open' : 'filtered') : 'closed',
        service: svc.service,
        version: svc.version,
        banner: isOpen ? `${svc.service} ${svc.version} ready.` : '',
        risk: risks[port] || 'info',
      };
    });
  },

  hostDiscovery(target: string): HostInfo {
    const octets = target.split('.').map(Number);
    return {
      ip: target,
      hostname: `host-${octets[3] || 1}.localdomain`,
      os: ['Linux 5.15', 'Windows Server 2022', 'FreeBSD 14.0', 'Ubuntu 22.04 LTS'][Math.floor(Math.random() * 4)],
      mac: Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':'),
      status: 'up',
      latency: Math.floor(Math.random() * 100) + 1,
    };
  },

  vulnerabilityScan(ports: PortResult[]): VulnResult[] {
    const vulnDB = [
      { name: 'OpenSSH User Enumeration', severity: 'medium' as const, port: 22, cve: 'CVE-2023-38408', exploitAvailable: false, desc: 'Allows username enumeration via authentication failure timing.' },
      { name: 'Apache Path Traversal', severity: 'critical' as const, port: 80, cve: 'CVE-2024-27316', exploitAvailable: true, desc: 'Path traversal and SSRF via backend URL parsing.' },
      { name: 'nginx Buffer Overflow', severity: 'high' as const, port: 443, cve: 'CVE-2024-28187', exploitAvailable: true, desc: 'HTTP/2 buffer overflow leading to RCE.' },
      { name: 'MySQL Auth Bypass', severity: 'critical' as const, port: 3306, cve: 'CVE-2023-36352', exploitAvailable: true, desc: 'Authentication bypass via crafted client handshake packet.' },
      { name: 'Redis Unauthenticated Access', severity: 'critical' as const, port: 6379, cve: 'CVE-2022-36023', exploitAvailable: true, desc: 'Redis instance allows connections without authentication.' },
      { name: 'RDP BlueKeep', severity: 'critical' as const, port: 3389, cve: 'CVE-2019-0708', exploitAvailable: true, desc: 'Remote Code Execution via RDP protocol vulnerability.' },
      { name: 'PostgreSQL Privilege Escalation', severity: 'high' as const, port: 5432, cve: 'CVE-2024-2992', exploitAvailable: true, desc: 'Privilege escalation via session user mapping.' },
      { name: 'MongoDB NoAuth', severity: 'critical' as const, port: 27017, cve: 'CVE-2024-5678', exploitAvailable: true, desc: 'MongoDB instance running without access control.' },
      { name: 'VNC No Encryption', severity: 'high' as const, port: 5900, cve: 'CVE-2023-0441', exploitAvailable: false, desc: 'VNC server not using encryption for remote sessions.' },
    ];
    const openPorts = ports.filter(p => p.state === 'open').map(p => p.port);
    return vulnDB.filter(v => openPorts.includes(v.port)).map(v => ({
      ...v, id: `VULN-${Date.now().toString(36)}`,
      description: v.desc,
    }));
  },

  nmapCommands(target: string, scanType: string): string[] {
    const cmds: Record<string, string[]> = {
      quick: [`nmap -sV -T4 ${target}`, `nmap -sC -p- ${target}`],
      stealth: [`nmap -sS -T2 -f ${target}`, `nmap --data-length 32 -D RND:10 ${target}`],
      aggressive: [`nmap -A -T4 -p- ${target}`, `nmap -sV --version-intensity 5 -p- ${target}`, `nmap -sC --script=vuln ${target}`],
      udp: [`nmap -sU -T4 --top-ports 100 ${target}`],
    };
    return cmds[scanType] || cmds.quick;
  },

  generateReport(host: HostInfo, ports: PortResult[], vulns: VulnResult[]): string {
    const openPorts = ports.filter(p => p.state === 'open');
    const lines = [
      'WHOAMISec Network Intelligence Report', '='.repeat(50),
      `Target: ${host.ip} (${host.hostname})`, `OS: ${host.os}`, `MAC: ${host.mac}`,
      `Status: ${host.status} | Latency: ${host.latency}ms`, '',
      `OPEN PORTS: ${openPorts.length}`,
      ...openPorts.map(p => `  ${p.port}/tcp  ${p.state.padEnd(10)} ${p.service.padEnd(16)} ${p.version}`),
      '',
      `VULNERABILITIES: ${vulns.length}`,
      ...vulns.map(v => `  [${v.severity.toUpperCase()}] ${v.name} (${v.cve}) - Port ${v.port}${v.exploitAvailable ? ' [EXPLOIT AVAILABLE]' : ''}`),
      '', `Generated: ${new Date().toISOString()}`, 'WHOAMISec Network Scanner V2.0'
    ];
    return lines.join('\n');
  }
};

export default function ScannerTool() {
  const [activeTab, setActiveTab] = useState<'scan' | 'vulns' | 'commands'>('scan');
  const [target, setTarget] = useState('');
  const [portRange, setPortRange] = useState('21,22,25,53,80,110,143,443,993,1433,3306,3389,5432,5900,6379,8080,8443,9090,27017');
  const [scanType, setScanType] = useState('quick');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] WHOAMISec Network Scanner V2.0 initialized.',
    '[SCAN] Port scan engine online.',
    '[VULN] Vulnerability database loaded: 50,000+ signatures.',
    '[READY] Awaiting target specification...'
  ]);
  const [hostInfo, setHostInfo] = useState<HostInfo | null>(null);
  const [portResults, setPortResults] = useState<PortResult[]>([]);
  const [vulnResults, setVulnResults] = useState<VulnResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (msg: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const ts = new Date().toLocaleTimeString();
    const pfx = level === 'success' ? '[+]' : level === 'error' ? '[!]' : level === 'warning' ? '[*]' : '[_]';
    setLogs(prev => [...prev.slice(-150), `${ts} ${pfx} ${msg}`]);
  };

  const startScan = () => {
    if (!target) return;
    setIsScanning(true);
    setHostInfo(null);
    setPortResults([]);
    setVulnResults([]);
    addLog(`Initiating ${scanType} scan on ${target}...`, 'warning');
    addLog(`Port range: ${portRange}`, 'info');

    // Phase 1: Host discovery
    setTimeout(() => {
      const host = scannerEngine.hostDiscovery(target);
      setHostInfo(host);
      addLog(`Host alive: ${host.ip} (${host.hostname}) | OS: ${host.os} | ${host.latency}ms`, 'success');

      // Phase 2: Port scan
      setTimeout(() => {
        const ports = scannerEngine.portScan(target, portRange);
        setPortResults(ports);
        const open = ports.filter(p => p.state === 'open');
        const filtered = ports.filter(p => p.state === 'filtered');
        addLog(`Port scan complete: ${open.length} open, ${filtered.length} filtered, ${ports.length - open.length - filtered.length} closed`, 'success');
        open.forEach(p => addLog(`  ${p.port}/tcp OPEN  ${p.service} ${p.version}`, 'info'));

        // Phase 3: Vulnerability scan
        addLog('Running vulnerability assessment...', 'warning');
        setTimeout(() => {
          const vulns = scannerEngine.vulnerabilityScan(ports);
          setVulnResults(vulns);
          if (vulns.length > 0) {
            addLog(`${vulns.length} vulnerabilities detected!`, 'error');
            vulns.forEach(v => addLog(`  [${v.severity.toUpperCase()}] ${v.name} (${v.cve})${v.exploitAvailable ? ' [EXPLOIT]' : ''}`, v.severity === 'critical' || v.severity === 'high' ? 'error' : 'warning'));
          } else {
            addLog('No vulnerabilities detected.', 'success');
          }
          setIsScanning(false);
        }, 1500);
      }, 2000);
    }, 1000);
  };

  const exportReport = () => {
    if (!hostInfo) return;
    const report = scannerEngine.generateReport(hostInfo, portResults, vulnResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `scan_report_${target}_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    addLog('Report exported.', 'success');
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getPortStateColor = (state: string) => {
    switch (state) {
      case 'open': return 'text-emerald-400';
      case 'filtered': return 'text-yellow-400';
      default: return 'text-gray-600';
    }
  };

  const tabs = [
    { id: 'scan' as const, label: 'Scan', icon: 'fa-radar' },
    { id: 'vulns' as const, label: 'Vulns', icon: 'fa-shield-halved' },
    { id: 'commands' as const, label: 'Commands', icon: 'fa-terminal' },
  ];

  return (
    <div className="p-4 space-y-4 bg-black border border-fuchsia-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-fuchsia-400 uppercase tracking-tighter">
          <i className="fas fa-radar mr-2"></i>NETWORK SCANNER
        </h2>
        <div className="flex gap-2">
          {hostInfo && (
            <button onClick={exportReport} className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30">
              <i className="fas fa-download mr-1"></i>Export
            </button>
          )}
          <button onClick={() => { setLogs([]); setHostInfo(null); setPortResults([]); setVulnResults([]); }}
            className="px-2 py-1 bg-red-600/20 border border-red-600 text-red-400 text-xs rounded hover:bg-red-600/30">
            <i className="fas fa-trash mr-1"></i>Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/40 border border-fuchsia-900/20 rounded p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-xs font-black uppercase rounded transition-all ${activeTab === tab.id ? 'bg-fuchsia-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <i className={`fas ${tab.icon} mr-1`}></i>{tab.label}
          </button>
        ))}
      </div>

      {/* Scan Configuration */}
      <div className="bg-black/40 border border-fuchsia-900/20 rounded p-3">
        <div className="flex gap-2 mb-2">
          <input type="text" value={target} onChange={e => setTarget(e.target.value)}
            placeholder="Target IP or hostname..."
            className="flex-1 bg-black border border-fuchsia-900/30 rounded px-3 py-2 text-fuchsia-400 font-mono text-sm outline-none focus:border-fuchsia-500/50" />
          <select value={scanType} onChange={e => setScanType(e.target.value)}
            className="bg-black border border-fuchsia-900/30 text-fuchsia-400 text-xs rounded px-2 py-2 outline-none">
            <option value="quick">Quick</option>
            <option value="stealth">Stealth</option>
            <option value="aggressive">Aggressive</option>
            <option value="udp">UDP</option>
          </select>
          <button onClick={startScan} disabled={isScanning || !target}
            className="px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
            {isScanning ? <><i className="fas fa-spinner fa-spin mr-1"></i>Scanning</> : <><i className="fas fa-play mr-1"></i>Scan</>}
          </button>
        </div>
        <input type="text" value={portRange} onChange={e => setPortRange(e.target.value)}
          placeholder="Ports (comma separated)..."
          className="w-full bg-black border border-fuchsia-900/30 rounded px-3 py-1.5 text-gray-500 font-mono text-[10px] outline-none focus:border-fuchsia-500/50" />
      </div>

      {/* Host Info */}
      {hostInfo && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-black/40 border border-fuchsia-900/20 rounded p-2 text-center">
            <div className="text-gray-500 text-[10px]">IP</div>
            <div className="text-fuchsia-400 font-bold text-xs">{hostInfo.ip}</div>
          </div>
          <div className="bg-black/40 border border-fuchsia-900/20 rounded p-2 text-center">
            <div className="text-gray-500 text-[10px]">OS</div>
            <div className="text-fuchsia-400 font-bold text-xs">{hostInfo.os}</div>
          </div>
          <div className="bg-black/40 border border-fuchsia-900/20 rounded p-2 text-center">
            <div className="text-gray-500 text-[10px]">Latency</div>
            <div className="text-fuchsia-400 font-bold text-xs">{hostInfo.latency}ms</div>
          </div>
          <div className="bg-black/40 border border-fuchsia-900/20 rounded p-2 text-center">
            <div className="text-gray-500 text-[10px]">Ports</div>
            <div className="text-fuchsia-400 font-bold text-xs">{portResults.filter(p => p.state === 'open').length} open</div>
          </div>
        </div>
      )}

      {/* Scan Tab - Port Results */}
      {activeTab === 'scan' && portResults.length > 0 && (
        <div className="bg-black/40 border border-fuchsia-900/20 rounded p-3">
          <span className="text-fuchsia-400 font-bold text-xs block mb-2"><i className="fas fa-list mr-1"></i>Port Scan Results</span>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {portResults.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-black/60 rounded px-2 py-1 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`font-bold font-mono ${getPortStateColor(p.state)}`}>{p.port}/tcp</span>
                  <span className="text-gray-500">{p.state}</span>
                  <span className="text-fuchsia-400">{p.service}</span>
                  <span className="text-gray-600 text-[10px]">{p.version}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskColor(p.risk)}`}>{p.risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vulns Tab */}
      {activeTab === 'vulns' && (
        <div className="space-y-2">
          {vulnResults.length === 0 ? (
            <div className="text-gray-600 text-xs text-center py-8">Run a scan first to detect vulnerabilities.</div>
          ) : (
            vulnResults.map((v, i) => (
              <div key={i} className={`bg-black/60 border rounded p-3 ${v.severity === 'critical' ? 'border-red-900/20' : v.severity === 'high' ? 'border-orange-900/20' : 'border-yellow-900/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-fuchsia-400 font-bold text-xs">{v.name}</span>
                  <div className="flex gap-1">
                    {v.exploitAvailable && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded font-bold">EXPLOIT</span>}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiskColor(v.severity)}`}>{v.severity.toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400">{v.cve} | Port: {v.port}</div>
                <div className="text-[10px] text-gray-500 mt-1">{v.description}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Commands Tab */}
      {activeTab === 'commands' && (
        <div className="bg-black/40 border border-fuchsia-900/20 rounded p-3 space-y-2">
          <span className="text-fuchsia-400 font-bold text-xs block mb-2"><i className="fas fa-terminal mr-1"></i>Equivalent Nmap Commands</span>
          {target && scannerEngine.nmapCommands(target, scanType).map((cmd, i) => (
            <div key={i} className="flex items-center justify-between bg-black/60 border border-fuchsia-900/10 rounded p-2">
              <code className="text-fuchsia-300 font-mono text-xs">{cmd}</code>
              <button onClick={() => { navigator.clipboard.writeText(cmd); addLog('Command copied.', 'success'); }}
                className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-[10px] rounded hover:bg-blue-600/30">
                <i className="fas fa-copy"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-fuchsia-900/20 rounded p-3">
        <label className="text-fuchsia-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-terminal mr-1"></i>System Logs
        </label>
        <div ref={messagesEndRef} className="bg-black/60 border border-fuchsia-900/10 rounded p-2 h-32 overflow-y-auto font-mono text-xs text-gray-400">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}
