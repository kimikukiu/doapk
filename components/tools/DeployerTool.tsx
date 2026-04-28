import React, { useState, useRef, useEffect } from 'react';

interface Deployment {
  id: string;
  name: string;
  network: 'mainnet' | 'testnet' | 'devnet' | 'local';
  status: 'deploying' | 'success' | 'failed' | 'verifying';
  contract: string;
  txHash: string;
  timestamp: string;
  gasUsed: number;
  errors: string[];
}

interface CompiledContract {
  name: string;
  source: string;
  abi: string;
  bytecode: string;
  size: number;
  warnings: string[];
}

// Simulated deployment engine
const deployerEngine = {
  compile(source: string): CompiledContract {
    const warnings: string[] = [];
    if (source.includes('assembly')) warnings.push('Inline assembly detected — review for security');
    if (source.includes('selfdestruct')) warnings.push('selfdestruct() usage — deprecated in EIP-4758');
    if (source.includes('tx.origin')) warnings.push('tx.origin usage — potential auth bypass');
    if (source.length < 50) warnings.push('Source appears incomplete');
    return {
      name: `Contract_${Date.now().toString(36)}`,
      source,
      abi: JSON.stringify([{ "type": "constructor", "inputs": [{ "name": "_owner", "type": "address" }] }, { "type": "function", "name": "execute", "inputs": [], "outputs": [{ "name": "", "type": "bool" }] }]),
      bytecode: '6080604052' + Array.from({ length: Math.floor(Math.random() * 500) + 200 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
      size: Math.floor(Math.random() * 15000) + 2000,
      warnings,
    };
  },

  deploy(contract: CompiledContract, network: string): Promise<Deployment> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.15;
        resolve({
          id: Date.now().toString(36),
          name: contract.name,
          network: network as Deployment['network'],
          status: success ? 'success' : 'failed',
          contract: '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
          txHash: '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
          timestamp: new Date().toISOString(),
          gasUsed: Math.floor(Math.random() * 500000) + 100000,
          errors: success ? [] : ['Revert: execution reverted', 'Out of gas during deployment'],
        });
      }, 2000 + Math.random() * 1500);
    });
  },

  verify(contract: string, network: string): Promise<{ verified: boolean; explorerUrl: string; optimizations: string[] }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const verified = Math.random() > 0.3;
        resolve({
          verified,
          explorerUrl: `https://solscan.io/${network === 'mainnet' ? '' : network + '/'}tx/${contract.substring(0, 16)}...`,
          optimizations: verified
            ? ['Gas optimization: -15%', 'Storage layout optimized', 'Proxy pattern detected and validated']
            : ['Contract too large for single verification', 'Split into multiple files'],
        });
      }, 1500);
    });
  },

  generateDeployScript(contract: CompiledContract, network: string): string {
    return `// WHOAMISec Auto-Deploy Script
// Contract: ${contract.name}
// Network: ${network}
// Generated: ${new Date().toISOString()}

const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("${network}_RPC_URL");
  const wallet = new ethers.Wallet("DEPLOYER_PRIVATE_KEY", provider);
  
  const bytecode = "0x${contract.bytecode.substring(0, 32)}...";
  const abi = ${contract.abi};
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log("Deploying ${contract.name}...");
  
  const contract = await factory.deploy({ gasLimit: 5000000 });
  await contract.deployed();
  
  console.log("Deployed to:", contract.address);
  console.log("TX:", contract.deployTransaction.hash);
  console.log("Gas used:", contract.deployTransaction.gasLimit.toString());
}

main().catch(console.error);`;
  }
};

export default function DeployerTool() {
  const [activeTab, setActiveTab] = useState<'deploy' | 'history' | 'verify'>('deploy');
  const [contractSource, setContractSource] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Zero-Time Deployer V3.0 initialized.',
    '[READY] Solidity/Rust/Solang compiler online.',
    '[READY] Multi-chain deployment engine ready.'
  ]);
  const [compiled, setCompiled] = useState<CompiledContract | null>(null);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [deployHistory, setDeployHistory] = useState<Deployment[]>([]);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; explorerUrl: string; optimizations: string[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const addLog = (msg: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const ts = new Date().toLocaleTimeString();
    const pfx = level === 'success' ? '[+]' : level === 'error' ? '[!]' : level === 'warning' ? '[*]' : '[_]';
    setLogs(prev => [...prev.slice(-100), `${ts} ${pfx} ${msg}`]);
  };

  const compileContract = () => {
    if (!contractSource.trim()) { addLog('No source code provided.', 'error'); return; }
    setIsProcessing(true);
    addLog('Compiling contract...', 'warning');
    setTimeout(() => {
      const result = deployerEngine.compile(contractSource);
      setCompiled(result);
      addLog(`Compiled: ${result.name} (${(result.size / 1024).toFixed(1)} KB)`, 'success');
      result.warnings.forEach(w => addLog(`WARNING: ${w}`, 'warning'));
      setIsProcessing(false);
    }, 1200);
  };

  const deployContract = async () => {
    if (!compiled) { addLog('Compile contract first.', 'error'); return; }
    setIsProcessing(true);
    setDeployment(null);
    addLog(`Deploying to ${network}...`, 'warning');
    try {
      const result = await deployerEngine.deploy(compiled, network);
      setDeployment(result);
      setDeployHistory(prev => [result, ...prev]);
      if (result.status === 'success') {
        addLog(`Deployed! Contract: ${result.contract}`, 'success');
        addLog(`TX: ${result.txHash.substring(0, 24)}...`, 'info');
        addLog(`Gas: ${result.gasUsed.toLocaleString()}`, 'info');
      } else {
        addLog(`Deployment FAILED: ${result.errors.join('; ')}`, 'error');
      }
    } catch (err: any) {
      addLog(`Deployment error: ${err.message}`, 'error');
    }
    setIsProcessing(false);
  };

  const verifyDeployment = async () => {
    if (!deployment || deployment.status !== 'success') { addLog('Need a successful deployment to verify.', 'error'); return; }
    setIsProcessing(true);
    addLog('Verifying contract on-chain...', 'warning');
    try {
      const result = await deployerEngine.verify(deployment.contract, network);
      setVerifyResult(result);
      if (result.verified) {
        addLog('Contract verified successfully!', 'success');
        result.optimizations.forEach(o => addLog(`OPT: ${o}`, 'info'));
      } else {
        addLog('Verification failed.', 'error');
      }
    } catch (err: any) {
      addLog(`Verify error: ${err.message}`, 'error');
    }
    setIsProcessing(false);
  };

  const copyDeployScript = () => {
    if (!compiled) return;
    const script = deployerEngine.generateDeployScript(compiled, network);
    navigator.clipboard.writeText(script);
    addLog('Deploy script copied to clipboard.', 'success');
  };

  const tabs = [
    { id: 'deploy' as const, label: 'Deploy', icon: 'fa-rocket' },
    { id: 'history' as const, label: 'History', icon: 'fa-history' },
    { id: 'verify' as const, label: 'Verify', icon: 'fa-check-double' },
  ];

  return (
    <div className="p-4 space-y-4 bg-black border border-orange-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-orange-400 uppercase tracking-tighter">
          <i className="fas fa-rocket mr-2"></i>ZERO-TIME DEPLOYER
        </h2>
        <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs rounded font-bold">
          V3.0
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/40 border border-orange-900/20 rounded p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-xs font-black uppercase rounded transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            <i className={`fas ${tab.icon} mr-1`}></i>{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'deploy' && (
        <div className="space-y-3">
          <div className="bg-black/40 border border-orange-900/20 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-orange-400 text-xs font-black uppercase">
                <i className="fas fa-code mr-1"></i>Contract Source
              </label>
              <select value={network} onChange={e => setNetwork(e.target.value)}
                className="bg-black border border-orange-900/30 text-orange-400 text-xs rounded px-2 py-1 outline-none">
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
                <option value="devnet">Devnet</option>
                <option value="local">Local</option>
              </select>
            </div>
            <textarea value={contractSource} onChange={e => setContractSource(e.target.value)} rows={6}
              placeholder="Paste Solidity/Vyper/Rust source code here..."
              className="w-full bg-black border border-orange-900/30 rounded px-3 py-2 text-orange-400 font-mono text-xs outline-none focus:border-orange-500/50 resize-none" />
            <div className="flex gap-2 mt-2">
              <button onClick={compileContract} disabled={isProcessing || !contractSource.trim()}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
                {isProcessing && !compiled ? <><i className="fas fa-spinner fa-spin mr-1"></i>Compiling...</> : <><i className="fas fa-cog mr-1"></i>Compile</>}
              </button>
              <button onClick={deployContract} disabled={isProcessing || !compiled}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
                {isProcessing && compiled ? <><i className="fas fa-spinner fa-spin mr-1"></i>Deploying...</> : <><i className="fas fa-rocket mr-1"></i>Deploy</>}
              </button>
            </div>
          </div>

          {compiled && (
            <div className="bg-black/40 border border-orange-900/20 rounded p-3">
              <span className="text-orange-400 font-bold text-xs block mb-2"><i className="fas fa-file-code mr-1"></i>Compilation Output</span>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-black/60 border border-orange-900/10 rounded p-2">
                  <span className="text-gray-500 block">Name</span>
                  <span className="text-orange-300 font-bold">{compiled.name}</span>
                </div>
                <div className="bg-black/60 border border-orange-900/10 rounded p-2">
                  <span className="text-gray-500 block">Size</span>
                  <span className="text-orange-300 font-bold">{(compiled.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button onClick={copyDeployScript} className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30">
                <i className="fas fa-copy mr-1"></i>Copy Deploy Script
              </button>
            </div>
          )}

          {deployment && (
            <div className={`bg-black/40 border rounded p-3 ${deployment.status === 'success' ? 'border-emerald-900/20' : 'border-red-900/20'}`}>
              <span className={`font-bold text-xs block mb-2 ${deployment.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {deployment.status === 'success' ? <><i className="fas fa-check-circle mr-1"></i>Deployment Success</> : <><i className="fas fa-times-circle mr-1"></i>Deployment Failed</>}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/60 rounded p-1">
                  <span className="text-gray-500">Contract</span>
                  <div className="text-orange-300 font-mono text-[10px]">{deployment.contract}</div>
                </div>
                <div className="bg-black/60 rounded p-1">
                  <span className="text-gray-500">Gas Used</span>
                  <span className="text-orange-300 font-bold">{deployment.gasUsed.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {deployHistory.length === 0 ? (
            <div className="text-gray-600 text-xs text-center py-8">No deployments yet. Compile and deploy a contract.</div>
          ) : (
            deployHistory.map((d, i) => (
              <div key={i} className={`bg-black/60 border rounded p-3 ${d.status === 'success' ? 'border-emerald-900/20' : 'border-red-900/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-orange-400 font-bold text-xs">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">{d.network}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">{d.contract} | Gas: {d.gasUsed.toLocaleString()} | {d.timestamp}</div>
                {d.errors.length > 0 && d.errors.map((e, j) => (
                  <div key={j} className="text-[10px] text-red-400 mt-1">{e}</div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="space-y-3">
          <button onClick={verifyDeployment} disabled={isProcessing || !deployment || deployment.status !== 'success'}
            className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50">
            {isProcessing ? <><i className="fas fa-spinner fa-spin mr-1"></i>Verifying...</> : <><i className="fas fa-check-double mr-1"></i>Verify Last Deployment</>}
          </button>
          {verifyResult && (
            <div className={`bg-black/40 border rounded p-3 ${verifyResult.verified ? 'border-emerald-900/20' : 'border-red-900/20'}`}>
              <span className={`font-bold text-xs ${verifyResult.verified ? 'text-emerald-400' : 'text-red-400'}`}>
                {verifyResult.verified ? 'VERIFIED' : 'NOT VERIFIED'}
              </span>
              {verifyResult.optimizations.map((o, i) => (
                <div key={i} className="text-xs text-gray-400 mt-1"><i className="fas fa-check text-emerald-500 mr-1"></i>{o}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-orange-900/20 rounded p-3">
        <label className="text-orange-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-terminal mr-1"></i>System Logs
        </label>
        <div ref={messagesEndRef} className="bg-black/60 border border-orange-900/10 rounded p-2 h-28 overflow-y-auto font-mono text-xs text-gray-400">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}
