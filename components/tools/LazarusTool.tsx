import React, { useState, useRef, useEffect } from 'react';
import { lazarusAptService, FinancialTarget, LazarusOperation, MalwareVariant } from '../../src/services/lazarusAptService';

export default function LazarusTool() {
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState<FinancialTarget['type']>('bank');
  const [country, setCountry] = useState('United States');
  const [isAttacking, setIsAttacking] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'LAZARUS APT38 CORE initialized.',
    'WARNING: State-sponsored simulation mode active.',
    'Real APT tactics and procedures loaded.'
  ]);
  const [operations, setOperations] = useState<LazarusOperation[]>([]);
  const [selectedMalware, setSelectedMalware] = useState<MalwareVariant | null>(null);
  const [stolenData, setStolenData] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [moneroAddress, setMoneroAddress] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [apkContact, setApkContact] = useState('');
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

  const startInfiltration = async () => {
    if (!target) {
      alert('Please enter a target institution or domain.');
      return;
    }

    setIsAttacking(true);
    setOperations([]);
    setStolenData(null);

    const financialTarget: FinancialTarget = {
      name: target,
      type: targetType,
      country,
      url: target.includes('http') ? target : `https://${target}`
    };

    addLog(`Initiating APT38 operation on: ${target} (${targetType})`, 'warning');

    try {
      // Full APT operation
      const aptOperations = await lazarusAptService.fullAptOperation(financialTarget);
      setOperations(aptOperations);
      
      const successCount = aptOperations.filter(op => op.status === 'success').length;
      addLog(`APT operation complete. ${successCount}/${aptOperations.length} stages successful.`, 'success');
      
      // Extract stolen data
      const exfilOp = aptOperations.find(op => op.stage === 'exfiltration' && op.status === 'success');
      if (exfilOp && exfilOp.stolenData) {
        setStolenData(exfilOp.stolenData);
        addLog('Data exfiltration successful!', 'success');
        addLog(`Stolen customer records: ${exfilOp.stolenData.customerData?.count || 0}`, 'info');
        addLog(`Stolen transaction records: ${exfilOp.stolenData.transactionData?.count || 0}`, 'info');
        addLog(`Compromised credentials: ${exfilOp.stolenData.credentials?.adminAccounts || 0}`, 'warning');
      }
      
    } catch (error: any) {
      addLog(`Infiltration failed: ${error.message}`, 'error');
    } finally {
      setIsAttacking(false);
    }
  };

  const generateMalware = (malware: MalwareVariant) => {
    const payload = lazarusAptService.generateMalwarePayload(malware);
    addLog(`Generated ${malware.name} payload: ${payload.length} bytes`, 'success');
    
    // Create download
    const blob = new Blob([payload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${malware.name.toLowerCase()}_payload.cpp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog(`Malware payload saved: ${malware.name}.cpp`, 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addLog('Copied to clipboard', 'success');
    });
  };

  const clearResults = () => {
    lazarusAptService.clearOperations();
    setOperations([]);
    setStolenData(null);
    addLog('Operations cleared', 'info');
  };

  const exportResults = () => {
    const data = lazarusAptService.exportOperations();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lazarus_apt38_operations_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Operations exported', 'success');
  };

  const processPayment = () => {
    if (!stolenData || !walletAddress || !payoutAmount || !moneroAddress) {
      addLog('Missing payment configuration or stolen data', 'error');
      return;
    }

    addLog('Processing payment through cryptocurrency network...', 'warning');
    
    // Simulate payment processing
    setTimeout(() => {
      const totalValue = stolenData.transactionData?.totalAmount || '$0';
      const ptcValue = parseFloat(payoutAmount) || 0;
      
      addLog(`Payment processed: ${ptcValue} PTC`, 'success');
      addLog(`Converted from stolen value: ${totalValue}`, 'info');
      addLog(`Routed to Monero address: ${moneroAddress.substring(0, 10)}...`, 'success');
      addLog(`Transaction confirmed - funds laundered successfully`, 'success');
      
      // Clear payment fields after processing
      setPayoutAmount('');
      addLog('Payment configuration cleared for security', 'warning');
    }, 2000);
  };

  const getStageColor = (stage: LazarusOperation['stage']) => {
    switch (stage) {
      case 'recon': return 'text-blue-400';
      case 'initial': return 'text-orange-400';
      case 'lateral': return 'text-yellow-400';
      case 'exfiltration': return 'text-red-400';
      case 'persistence': return 'text-purple-400';
      case 'completed': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: LazarusOperation['status']) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'error': return 'text-red-500';
      case 'in_progress': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const malwareVariants = lazarusAptService.getMalwareVariants();

  return (
    <div className="p-4 space-y-4 bg-black border border-purple-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-purple-400 uppercase tracking-tighter">
          <i className="fas fa-user-secret mr-2"></i>LAZARUS APT38
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isAttacking ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {isAttacking ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Target Configuration */}
      <div className="bg-black/40 border border-purple-900/20 rounded p-3">
        <label className="text-purple-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-crosshairs mr-1"></i>Target Configuration
        </label>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target institution or domain..."
          className="w-full bg-black border border-purple-900/30 rounded px-3 py-2 text-purple-400 font-mono text-sm outline-none focus:border-purple-500/50 mb-2"
        />
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-purple-400 text-xs font-black uppercase block mb-1">Target Type</label>
            <select
              value={targetType}
              onChange={e => setTargetType(e.target.value as FinancialTarget['type'])}
              className="w-full bg-black border border-purple-900/30 rounded px-2 py-1 text-purple-400 font-mono text-xs outline-none focus:border-purple-500/50"
            >
              <option value="bank">Bank</option>
              <option value="exchange">Exchange</option>
              <option value="payment">Payment</option>
              <option value="crypto">Crypto</option>
              <option value="atm">ATM</option>
              <option value="swift">SWIFT</option>
            </select>
          </div>
          <div>
            <label className="text-purple-400 text-xs font-black uppercase block mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="United States"
              className="w-full bg-black border border-purple-900/30 rounded px-2 py-1 text-purple-400 font-mono text-xs outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
        
        <button
          onClick={startInfiltration}
          disabled={isAttacking || !target}
          className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
        >
          {isAttacking ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>Infiltrating...
            </>
          ) : (
            <>
              <i className="fas fa-bomb mr-1"></i>Start Infiltration
            </>
          )}
        </button>
      </div>

      {/* Wallet Configuration */}
      <div className="bg-black/40 border border-purple-900/20 rounded p-3">
        <label className="text-purple-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-wallet mr-1"></i>Payment Configuration
        </label>
        <div className="space-y-2">
          <div>
            <label className="text-purple-400 text-xs font-black uppercase block mb-1">Your Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              placeholder="Enter your wallet address..."
              className="w-full bg-black border border-purple-900/30 rounded px-3 py-2 text-purple-400 font-mono text-sm outline-none focus:border-purple-500/50"
            />
          </div>
          
          <div>
            <label className="text-purple-400 text-xs font-black uppercase block mb-1">Payout Amount (PTC)</label>
            <input
              type="text"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)}
              placeholder="Enter amount in PTC..."
              className="w-full bg-black border border-purple-900/30 rounded px-3 py-2 text-purple-400 font-mono text-sm outline-none focus:border-purple-500/50"
            />
          </div>
          
          <div>
            <label className="text-purple-400 text-xs font-black uppercase block mb-1">Monero Receive Address</label>
            <input
              type="text"
              value={moneroAddress}
              onChange={e => setMoneroAddress(e.target.value)}
              placeholder="Enter Monero address for payout..."
              className="w-full bg-black border border-purple-900/30 rounded px-3 py-2 text-purple-400 font-mono text-sm outline-none focus:border-purple-500/50"
            />
          </div>
          
          <button
            onClick={() => {
              if (walletAddress && payoutAmount && moneroAddress) {
                addLog(`Payment configuration saved: ${payoutAmount} PTC to ${moneroAddress}`, 'success');
                addLog(`Funds will be routed through wallet: ${walletAddress.substring(0, 10)}...`, 'info');
              } else {
                addLog('Please fill all payment fields', 'error');
              }
            }}
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all"
          >
            <i className="fas fa-save mr-1"></i>Save Payment Config
          </button>
        </div>
      </div>

      {/* Session ID & APK Contact */}
      <div className="bg-black/40 border border-purple-900/20 rounded p-3">
        <label className="text-purple-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-id-badge mr-1"></i>Session ID & APK Contact
        </label>
        <div className="space-y-2">
          <div>
            <label className="text-purple-400 text-xs font-black uppercase block mb-1">Session ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                placeholder="ALPHV_12345_67890..."
                className="flex-1 bg-black border border-purple-900/30 rounded px-3 py-2 text-purple-400 font-mono text-sm outline-none focus:border-purple-500/50"
              />
              <button
                onClick={() => {
                  const newSessionId = `ALPHV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  setSessionId(newSessionId);
                  addLog(`Generated session ID: ${newSessionId}`, 'success');
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded transition-all"
              >
                <i className="fas fa-sync mr-1"></i>Generate
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-purple-400 text-xs font-black uppercase block mb-1">APK Contact Method</label>
            <input
              type="text"
              value={apkContact}
              onChange={e => setApkContact(e.target.value)}
              placeholder="Telegram: @alphv_support or Signal: +1234567890"
              className="w-full bg-black border border-purple-900/30 rounded px-3 py-2 text-purple-400 font-mono text-sm outline-none focus:border-purple-500/50"
            />
          </div>
          
          <button
            onClick={() => {
              if (sessionId && apkContact) {
                addLog(`Session ID configured: ${sessionId}`, 'success');
                addLog(`Contact method set: ${apkContact}`, 'success');
                addLog('Victim can now contact for decryption support', 'info');
              } else {
                addLog('Please fill session ID and contact method', 'error');
              }
            }}
            className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all"
          >
            <i className="fas fa-save mr-1"></i>Save Contact Config
          </button>
          
          <div className="text-xs text-yellow-400">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Session ID will be included in ransom notes for victim contact
          </div>
        </div>
      </div>

      {/* Malware Selection */}
      <div className="bg-black/40 border border-purple-900/20 rounded p-3">
        <label className="text-purple-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-bug mr-1"></i>Malware Arsenal
        </label>
        <div className="grid grid-cols-2 gap-2">
          {malwareVariants.map((malware, index) => (
            <div
              key={index}
              onClick={() => setSelectedMalware(malware)}
              className={`p-2 border rounded cursor-pointer transition-all ${
                selectedMalware?.name === malware.name
                  ? 'bg-purple-600/30 border-purple-600'
                  : 'bg-black border-purple-900/30 hover:bg-purple-800/20'
              }`}
            >
              <div className="text-purple-400 font-bold text-xs">{malware.name}</div>
              <div className="text-gray-500 text-xs">{malware.family}</div>
              <div className="text-xs">
                <span className="text-blue-400">{malware.type}</span>
                <span className="text-yellow-400 ml-2">{malware.delivery}</span>
              </div>
              <button
                onClick={() => generateMalware(malware)}
                className="mt-1 w-full py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all"
              >
                <i className="fas fa-download mr-1"></i>Generate
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stolen Data */}
      {stolenData && (
        <div className="bg-black/40 border border-purple-900/20 rounded p-3">
          <label className="text-purple-400 text-xs font-black uppercase block mb-2">
            <i className="fas fa-database mr-1"></i>Exfiltrated Data
          </label>
          <div className="space-y-2">
            <div className="bg-black/60 border border-purple-900/10 rounded p-2">
              <h4 className="text-red-400 font-bold text-xs mb-1">Customer Data</h4>
              <div className="text-xs text-gray-300">
                <div>Records: {stolenData.customerData?.count || 0}</div>
                <div>Fields: {stolenData.customerData?.fields?.join(', ') || 'N/A'}</div>
              </div>
            </div>
            
            <div className="bg-black/60 border border-purple-900/10 rounded p-2">
              <h4 className="text-orange-400 font-bold text-xs mb-1">Transaction Data</h4>
              <div className="text-xs text-gray-300">
                <div>Records: {stolenData.transactionData?.count || 0}</div>
                <div>Period: {stolenData.transactionData?.period || 'N/A'}</div>
                <div>Total: {stolenData.transactionData?.totalAmount || 'N/A'}</div>
              </div>
            </div>
            
            <div className="bg-black/60 border border-purple-900/10 rounded p-2">
              <h4 className="text-yellow-400 font-bold text-xs mb-1">Compromised Credentials</h4>
              <div className="text-xs text-gray-300">
                <div>Admin Accounts: {stolenData.credentials?.adminAccounts || 0}</div>
                <div>Database Credentials: {stolenData.credentials?.databaseCredentials || 0}</div>
                <div>API Keys: {stolenData.credentials?.apiKeys || 0}</div>
              </div>
            </div>
            
            {/* Payment Processing */}
            <div className="bg-black/60 border border-purple-900/10 rounded p-2">
              <h4 className="text-green-400 font-bold text-xs mb-2">
                <i className="fas fa-coins mr-1"></i>Payment Processing
              </h4>
              <div className="space-y-2">
                <div className="text-xs text-gray-300">
                  <div>Wallet: {walletAddress ? `${walletAddress.substring(0, 10)}...` : 'Not configured'}</div>
                  <div>Amount: {payoutAmount || '0'} PTC</div>
                  <div>Monero: {moneroAddress ? `${moneroAddress.substring(0, 10)}...` : 'Not configured'}</div>
                </div>
                
                <button
                  onClick={processPayment}
                  disabled={!walletAddress || !payoutAmount || !moneroAddress}
                  className="w-full py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
                >
                  <i className="fas fa-exchange-alt mr-1"></i>Process Payment
                </button>
                
                <div className="text-xs text-yellow-400">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  Funds will be converted to Monero for anonymous transfer
                </div>
              </div>
            </div>
          </div>
        
        {/* Session ID & Contact Info */}
        <div className="bg-black/60 border border-purple-900/10 rounded p-2">
          <h4 className="text-cyan-400 font-bold text-xs mb-2">
            <i className="fas fa-id-badge mr-1"></i>Session & Contact Information
          </h4>
          <div className="space-y-2">
            <div className="text-xs text-gray-300">
              <div>Session ID: {sessionId || 'Not generated'}</div>
              <div>Contact: {apkContact || 'Not configured'}</div>
              <div>Status: {sessionId && apkContact ? 'Active' : 'Incomplete'}</div>
            </div>
            
            <div className="text-xs text-blue-400">
              <i className="fas fa-info-circle mr-1"></i>
              Victims will use this Session ID to contact for decryption
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={exportResults}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded transition-all"
        >
          <i className="fas fa-download mr-1"></i>Export
        </button>
        <button
          onClick={clearResults}
          className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all"
        >
          <i className="fas fa-trash mr-1"></i>Clear
        </button>
      </div>

      {/* System Logs */}
      <div className="bg-black/40 border border-purple-900/20 rounded p-3">
        <label className="text-purple-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-terminal mr-1"></i>System Logs
        </label>
        <div
          ref={messagesEndRef}
          className="bg-black/60 border border-purple-900/10 rounded p-2 h-32 overflow-y-auto font-mono text-xs text-gray-400"
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
