import React, { useState, useRef, useEffect } from 'react';
import { s3ExploitService, S3Bucket, S3Object, S3ExploitResult } from '../../src/services/s3ExploitService';

export default function S3BucketsTool() {
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'S3 BUCKET REAPER V2.0 initialized.',
    'Real AWS S3 exploitation engine ready.',
    'Awaiting target domain or keyword...'
  ]);
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [results, setResults] = useState<S3ExploitResult[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<S3Bucket | null>(null);
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

  const startScan = async () => {
    if (!target) {
      alert('Please enter a target domain or keyword.');
      return;
    }

    setIsScanning(true);
    setBuckets([]);
    setResults([]);
    addLog(`Starting S3 bucket enumeration for: ${target}`, 'warning');

    try {
      const discoveredBuckets = await s3ExploitService.enumerateBuckets(target);
      setBuckets(discoveredBuckets);
      
      addLog(`Enumeration complete. Found ${discoveredBuckets.length} buckets`, 'success');
      
      // Automatically test each bucket
      for (const bucket of discoveredBuckets) {
        addLog(`Testing bucket: ${bucket.name}`, 'info');
        const listingResult = await s3ExploitService.checkBucketListing(bucket.name);
        results.push(listingResult);
        
        if (listingResult.status === 'success') {
          addLog(`✓ Bucket ${bucket.name} - LISTING VULNERABLE!`, 'success');
        }
        
        const writeResult = await s3ExploitService.checkBucketWrite(bucket.name);
        results.push(writeResult);
        
        if (writeResult.status === 'success') {
          addLog(`✓ Bucket ${bucket.name} - WRITE VULNERABLE!`, 'success');
        }
      }
      
      setResults(results);
      results.forEach(result => s3ExploitService.addResult(result));
      
    } catch (error: any) {
      addLog(`Scan failed: ${error.message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const exploitBucket = async (bucket: S3Bucket) => {
    addLog(`Starting full exploitation of bucket: ${bucket.name}`, 'warning');
    
    try {
      const exploitResults = await s3ExploitService.exploitBucket(bucket.name);
      setResults([...results, ...exploitResults]);
      
      addLog(`Exploitation complete for ${bucket.name}`, 'success');
      
      const successCount = exploitResults.filter(r => r.status === 'success').length;
      addLog(`Successful operations: ${successCount}/${exploitResults.length}`, 'info');
      
    } catch (error: any) {
      addLog(`Exploitation failed: ${error.message}`, 'error');
    }
  };

  const downloadObject = async (bucketName: string, objectKey: string) => {
    addLog(`Downloading object: ${objectKey} from ${bucketName}`, 'info');
    
    try {
      const result = await s3ExploitService.downloadObject(bucketName, objectKey);
      results.push(result);
      setResults([...results, result]);
      
      if (result.status === 'success') {
        addLog(`✓ Successfully downloaded: ${objectKey}`, 'success');
        
        // Create download
        const blob = new Blob([result.output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = objectKey.split('/').pop() || objectKey;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog(`File saved: ${objectKey}`, 'success');
      } else {
        addLog(`Failed to download: ${objectKey}`, 'error');
      }
      
    } catch (error: any) {
      addLog(`Download failed: ${error.message}`, 'error');
    }
  };

  const checkCredentials = async (bucketName: string) => {
    addLog(`Checking for credentials in bucket: ${bucketName}`, 'info');
    
    try {
      const result = await s3ExploitService.checkCredentials(bucketName);
      results.push(result);
      setResults([...results, result]);
      
      if (result.status === 'success') {
        addLog(`✓ Credentials found in ${bucketName}!`, 'success');
      } else {
        addLog(`No credentials found in ${bucketName}`, 'warning');
      }
      
    } catch (error: any) {
      addLog(`Credential check failed: ${error.message}`, 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addLog('Copied to clipboard', 'success');
    });
  };

  const clearResults = () => {
    s3ExploitService.clearResults();
    setResults([]);
    addLog('Results cleared', 'info');
  };

  const exportResults = () => {
    const data = s3ExploitService.exportResults();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `s3_exploit_results_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Results exported', 'success');
  };

  const getRiskColor = (permissions: S3Bucket['permissions']) => {
    if (permissions.read && permissions.write && permissions.list && permissions.acl) {
      return 'text-red-400';
    } else if (permissions.read || permissions.list) {
      return 'text-orange-400';
    } else {
      return 'text-yellow-400';
    }
  };

  return (
    <div className="p-4 space-y-4 bg-black border border-yellow-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-yellow-400 uppercase tracking-tighter">
          <i className="fab fa-aws mr-2"></i>S3 BUCKET REAPER
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            buckets.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {buckets.length} BUCKETS
          </span>
        </div>
      </div>

      {/* Target Configuration */}
      <div className="bg-black/40 border border-yellow-900/20 rounded p-3">
        <label className="text-yellow-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-crosshairs mr-1"></i>Target Configuration
        </label>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target domain or keyword..."
          className="w-full bg-black border border-yellow-900/30 rounded px-3 py-2 text-yellow-400 font-mono text-sm outline-none focus:border-yellow-500/50"
        />
        <button
          onClick={startScan}
          disabled={isScanning || !target}
          className="mt-2 w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>Scanning...
            </>
          ) : (
            <>
              <i className="fas fa-search mr-1"></i>Enumerate Buckets
            </>
          )}
        </button>
      </div>

      {/* Bucket List */}
      {buckets.length > 0 && (
        <div className="bg-black/40 border border-yellow-900/20 rounded p-3">
          <label className="text-yellow-400 text-xs font-black uppercase block mb-2">
            <i className="fas fa-database mr-1"></i>Discovered Buckets
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {buckets.map((bucket, index) => (
              <div key={index} className="bg-black/60 border border-yellow-900/10 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-yellow-400 font-bold">{bucket.name}</h4>
                    <p className="text-gray-500 text-xs">Region: {bucket.region}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRiskColor(bucket.permissions)}`}>
                    {bucket.permissions.read ? 'R' : ''}
                    {bucket.permissions.write ? 'W' : ''}
                    {bucket.permissions.list ? 'L' : ''}
                    {bucket.permissions.acl ? 'A' : ''}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedBucket(bucket)}
                    className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30"
                  >
                    <i className="fas fa-eye mr-1"></i>Details
                  </button>
                  <button
                    onClick={() => exploitBucket(bucket)}
                    className="px-2 py-1 bg-red-600/20 border border-red-600 text-red-400 text-xs rounded hover:bg-red-600/30"
                  >
                    <i className="fas fa-bomb mr-1"></i>Exploit
                  </button>
                  <button
                    onClick={() => checkCredentials(bucket.name)}
                    className="px-2 py-1 bg-orange-600/20 border border-orange-600 text-orange-400 text-xs rounded hover:bg-orange-600/30"
                  >
                    <i className="fas fa-key mr-1"></i>Creds
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bucket Details */}
      {selectedBucket && (
        <div className="bg-black/40 border border-yellow-900/20 rounded p-3">
          <label className="text-yellow-400 text-xs font-black uppercase block mb-2">
            <i className="fas fa-info-circle mr-1"></i>Bucket Details: {selectedBucket.name}
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <span className="text-gray-400">Region:</span>
              <span className="text-yellow-400 ml-2">{selectedBucket.region}</span>
            </div>
            <div>
              <span className="text-gray-400">Objects:</span>
              <span className="text-yellow-400 ml-2">{selectedBucket.objectCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Size:</span>
              <span className="text-yellow-400 ml-2">{selectedBucket.size} bytes</span>
            </div>
            <div>
              <span className="text-gray-400">Created:</span>
              <span className="text-yellow-400 ml-2">{selectedBucket.creationDate.toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="mb-3">
            <span className="text-gray-400 text-xs">Permissions:</span>
            <div className="flex gap-2 mt-1">
              {selectedBucket.permissions.read && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">READ</span>}
              {selectedBucket.permissions.write && <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded">WRITE</span>}
              {selectedBucket.permissions.list && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">LIST</span>}
              {selectedBucket.permissions.acl && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">ACL</span>}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(s3ExploitService.generateAWSCommands(selectedBucket.name).join('\n'))}
              className="px-2 py-1 bg-green-600/20 border border-green-600 text-green-400 text-xs rounded hover:bg-green-600/30"
            >
              <i className="fas fa-terminal mr-1"></i>AWS CLI
            </button>
            <button
              onClick={() => copyToClipboard(s3ExploitService.generateS3cmdCommands(selectedBucket.name).join('\n'))}
              className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30"
            >
              <i className="fas fa-terminal mr-1"></i>s3cmd
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-black/40 border border-yellow-900/20 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-yellow-400 text-xs font-black uppercase block">
              <i className="fas fa-chart-bar mr-1"></i>Exploitation Results
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
                  <span className="text-yellow-400 font-bold text-xs">{result.exploit}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    result.status === 'success' ? 'bg-green-500/20 text-green-400' : 
                    result.status === 'failed' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-xs text-gray-400 mb-1">
                  Bucket: {result.bucket} | {result.timestamp.toLocaleTimeString()}
                </div>
                
                {result.objects && result.objects.length > 0 && (
                  <div className="mb-1">
                    <span className="text-gray-500 text-xs">Objects found:</span>
                    <span className="text-yellow-400 ml-2">{result.objects.length}</span>
                  </div>
                )}
                
                {result.output && (
                  <div className="bg-black/80 border border-yellow-900/10 rounded p-1">
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
      <div className="bg-black/40 border border-yellow-900/20 rounded p-3">
        <label className="text-yellow-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-terminal mr-1"></i>System Logs
        </label>
        <div
          ref={messagesEndRef}
          className="bg-black/60 border border-yellow-900/10 rounded p-2 h-32 overflow-y-auto font-mono text-xs text-gray-400"
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
