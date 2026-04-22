import { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';

const CHAINS: Record<string, { name: string; rpc: string; explorer: string; symbol: string }> = {
  ethereum: { name: 'Ethereum Mainnet', rpc: 'https://eth.llamarpc.com', explorer: 'https://etherscan.io', symbol: 'ETH' },
  sepolia: { name: 'Sepolia Testnet', rpc: 'https://rpc.sepolia.org', explorer: 'https://sepolia.etherscan.io', symbol: 'ETH' },
  polygon: { name: 'Polygon', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com', symbol: 'MATIC' },
  bsc: { name: 'BSC', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com', symbol: 'BNB' },
  arbitrum: { name: 'Arbitrum One', rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io', symbol: 'ETH' },
  base: { name: 'Base', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org', symbol: 'ETH' },
};

const DeployerTool: React.FC = () => {
  const [chain, setChain] = useState('sepolia');
  const [contractCode, setContractCode] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'ZERO_TIME_DEPLOYER_V2.0 initialized.',
    'Supported chains: Ethereum, Sepolia, Polygon, BSC, Arbitrum, Base',
    'Real RPC connections. Paste Solidity or ask AI to generate.',
    'Awaiting contract source...'
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const checkChain = async () => {
    const c = CHAINS[chain];
    addLog(`[*] Connecting to ${c.name} via ${c.rpc}...`);
    try {
      const response = await fetch(c.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      });
      const data = await response.json();
      const blockNum = parseInt(data.result, 16);
      addLog(`[+] Connected! Latest block: #${blockNum.toLocaleString()}`);

      const gasResponse = await fetch(c.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 2 }),
      });
      const gasData = await gasResponse.json();
      const gasGwei = (parseInt(gasData.result, 16) / 1e9).toFixed(2);
      addLog(`[+] Gas price: ${gasGwei} Gwei`);

      const chainResponse = await fetch(c.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 3 }),
      });
      const chainData = await chainResponse.json();
      addLog(`[+] Chain ID: ${parseInt(chainData.result, 16)}`);
      addLog(`[+] Explorer: ${c.explorer}`);
    } catch (err: any) {
      addLog(`[!] RPC connection failed: ${err.message}`);
    }
  };

  const generateContract = async () => {
    setIsDeploying(true);
    addLog(`[AI] Generating optimized smart contract...`);
    try {
      const response = await queryAgent("ORCHESTRATOR",
        `Generate a production-ready Solidity smart contract. Include: pragma solidity ^0.8.20, SPDX license, proper access control, events, and NatSpec comments. The contract should be an ERC20 token with mint/burn capabilities and owner-only functions. Return ONLY the Solidity code, no markdown.`,
        "Context: Smart contract generation for deployment");
      const code = response.replace(/```solidity\n?|\n?```/g, '').replace(/```\n?/g, '').trim();
      setContractCode(code);
      addLog(`[+] Contract generated (${code.length} chars). Review and deploy.`);
    } catch {
      addLog(`[!] AI generation failed.`);
    }
    setIsDeploying(false);
  };

  const analyzeContract = async () => {
    if (!contractCode.trim()) { alert('Paste or generate a contract first.'); return; }
    setIsDeploying(true);
    addLog(`[AI] Analyzing contract for vulnerabilities...`);
    try {
      const response = await queryAgent("ORCHESTRATOR",
        `You are a smart contract security auditor. Analyze this Solidity contract for vulnerabilities:\n\n${contractCode}\n\nCheck for: reentrancy, integer overflow, access control issues, front-running, gas optimization, and best practices. Provide a professional audit report.`,
        "Context: Smart contract security audit");
      response.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[AUDIT] ${line}`));
    } catch {
      addLog(`[!] Audit failed.`);
    }
    setIsDeploying(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#ff5e00] font-mono p-4">
      <div className="border-b border-[#ff5e00]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#ff5e00]">ZERO-TIME DEPLOYER</h1>
          <p className="text-xs text-[#ff5e00]/60 uppercase tracking-[0.3em]">Smart Contract Deployment & Verification</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#ff5e00]/80">Chain: {CHAINS[chain].name}</div>
          <div className="text-[10px] text-[#ff5e00]/50">Status: {isDeploying ? 'PROCESSING' : 'READY'}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 shrink-0 flex-wrap">
        {Object.entries(CHAINS).map(([key, c]) => (
          <button key={key} onClick={() => setChain(key)} className={`px-3 py-1.5 rounded font-bold uppercase text-[10px] transition-all ${chain === key ? 'bg-[#ff5e00] text-black' : 'bg-[#ff5e00]/10 text-[#ff5e00] border border-[#ff5e00]/30 hover:border-[#ff5e00]'}`}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 shrink-0">
        <button onClick={checkChain} disabled={isDeploying} className="px-4 py-2 rounded font-bold uppercase text-xs bg-[#ff5e00]/10 text-[#ff5e00] border border-[#ff5e00]/30 hover:bg-[#ff5e00] hover:text-black transition-all">
          <i className="fas fa-plug mr-1"></i> Check RPC
        </button>
        <button onClick={generateContract} disabled={isDeploying} className="px-4 py-2 rounded font-bold uppercase text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-600 hover:text-black transition-all">
          <i className="fas fa-robot mr-1"></i> AI Generate
        </button>
        <button onClick={analyzeContract} disabled={isDeploying || !contractCode} className="px-4 py-2 rounded font-bold uppercase text-xs bg-purple-900/30 text-purple-400 border border-purple-800/30 hover:bg-purple-600 hover:text-black transition-all">
          <i className="fas fa-shield-alt mr-1"></i> Security Audit
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <textarea
            value={contractCode}
            onChange={e => setContractCode(e.target.value)}
            placeholder="// Paste Solidity contract here or click AI Generate..."
            className="flex-1 bg-black border border-[#ff5e00]/30 rounded p-3 text-[#ff5e00] outline-none focus:border-[#ff5e00] font-mono text-xs resize-none"
            disabled={isDeploying}
          />
        </div>
        <div className="flex-1 bg-black border border-[#ff5e00]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <div className="space-y-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[!]') ? 'text-red-400 font-bold' : log.includes('[+]') ? 'text-emerald-400' : log.includes('[AI]') || log.includes('[AUDIT]') ? 'text-purple-400 font-bold' : 'text-[#ff5e00]/80'}`}>{log}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployerTool;
