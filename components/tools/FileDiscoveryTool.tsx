import React, { useState, useEffect, useRef } from 'react';
import { fileDiscoveryService, DiscoveredFile, DirectoryListing, ExtractionResult } from '../../src/services/fileDiscoveryService';

const FileDiscoveryTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'files' | 'extraction' | 'analysis'>('scan');
  const [targetUrl, setTargetUrl] = useState('https://partidulaur.ro/assets/uploads/');
  const [currentListing, setCurrentListing] = useState<DirectoryListing | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractions, setExtractions] = useState<ExtractionResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<DiscoveredFile | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleScanDirectory = async () => {
    setIsScanning(true);
    addLog(`Scanning directory: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl);
      const html = await response.text();
      
      if (response.ok) {
        const listing = fileDiscoveryService.parseDirectoryListing(html, targetUrl);
        fileDiscoveryService.addListing(listing);
        setCurrentListing(listing);
        
        addLog(`✅ Directory scanned successfully`);
        addLog(`📁 Found ${listing.files.length} files`);
        
        const riskSummary = fileDiscoveryService.getRiskSummary();
        addLog(`🔍 Risk summary: ${riskSummary.critical} critical, ${riskSummary.high} high, ${riskSummary.medium} medium`);
      } else {
        addLog(`❌ Failed to scan directory: ${response.status}`);
      }
    } catch (error: any) {
      addLog(`❌ Scan failed: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExtractFile = async (file: DiscoveredFile, method: string = 'direct_download') => {
    setIsExtracting(true);
    addLog(`Extracting file: ${file.name} (${method})`);

    try {
      const result = await fileDiscoveryService.extractFile(file, method);
      setExtractions(fileDiscoveryService.getExtractions());
      
      if (result.success) {
        addLog(`✅ File extracted successfully (${result.content.length} bytes)`);
      } else {
        addLog(`❌ Extraction failed: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Extraction error: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleQuickExtraction = async () => {
    if (!currentListing) return;
    
    setIsExtracting(true);
    addLog('Starting quick extraction of high-risk files...');

    const highRiskFiles = currentListing.files.filter(f => 
      f.riskLevel === 'critical' || f.riskLevel === 'high'
    );

    for (const file of highRiskFiles) {
      addLog(`Extracting: ${file.name}`);
      await handleExtractFile(file);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    addLog(`✅ Quick extraction complete (${highRiskFiles.length} files)`);
    setIsExtracting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addLog('Copied to clipboard');
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/20 border-red-500';
      case 'high': return 'bg-orange-500/20 border-orange-500';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500';
      case 'low': return 'bg-green-500/20 border-green-500';
      default: return 'bg-gray-500/20 border-gray-500';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'archive': return 'fa-file-archive';
      case 'config': return 'fa-file-code';
      case 'database': return 'fa-database';
      case 'log': return 'fa-file-alt';
      case 'backup': return 'fa-file-shield';
      default: return 'fa-file';
    }
  };

  return (
    <div className="p-4 space-y-4 bg-black border border-blue-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-blue-400 uppercase tracking-tighter">
          <i className="fas fa-folder-open mr-2"></i>File Discovery Engine
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            currentListing ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {currentListing ? `${currentListing.files.length} FILES` : 'NO SCAN'}
          </span>
        </div>
      </div>

      {/* Target Configuration */}
      <div className="bg-black/40 border border-blue-900/20 rounded p-3">
        <label className="text-blue-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-crosshairs mr-1"></i>Target Directory
        </label>
        <input
          type="text"
          value={targetUrl}
          onChange={e => setTargetUrl(e.target.value)}
          placeholder="Enter directory URL..."
          className="w-full bg-black border border-blue-900/30 rounded px-3 py-2 text-blue-400 font-mono text-sm outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleScanDirectory}
          disabled={isScanning}
          className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>Scanning...
            </>
          ) : (
            <>
              <i className="fas fa-search mr-1"></i>Scan Directory
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['scan', 'files', 'extraction', 'analysis'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-xs font-black uppercase transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-black border border-blue-900/30 text-blue-400 hover:bg-blue-900/20'
            }`}
          >
            <i className={`fas fa-${tab === 'scan' ? 'radar' : tab === 'files' ? 'folder' : tab === 'extraction' ? 'download' : 'chart-bar'} mr-1`}></i>
            {tab}
          </button>
        ))}
      </div>

      {/* Scan Tab */}
      {activeTab === 'scan' && (
        <div className="space-y-3">
          <h3 className="text-blue-400 text-sm font-black uppercase">Directory Scanner</h3>
          
          {currentListing && (
            <div className="bg-black/40 border border-blue-900/20 rounded p-3">
              <h4 className="text-blue-400 text-xs font-black uppercase mb-2">Scan Results</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Title:</span>
                  <span className="text-blue-400 ml-2">{currentListing.title}</span>
                </div>
                <div>
                  <span className="text-gray-400">Files:</span>
                  <span className="text-blue-400 ml-2">{currentListing.files.length}</span>
                </div>
                <div>
                  <span className="text-gray-400">Server:</span>
                  <span className="text-blue-400 ml-2">{currentListing.serverInfo?.software}</span>
                </div>
                <div>
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-blue-400 ml-2">{currentListing.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-4 gap-2">
                {Object.entries(fileDiscoveryService.getRiskSummary()).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <div className={`text-lg font-bold ${getRiskColor(level)}`}>{count}</div>
                    <div className="text-xs text-gray-500 capitalize">{level}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleQuickExtraction}
                disabled={isExtracting}
                className="mt-3 w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1"></i>Extracting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt mr-1"></i>Quick Extract High-Risk Files
                  </>
                )}
              </button>
            </div>
          )}

          <div className="bg-black/40 border border-blue-900/20 rounded p-3">
            <h4 className="text-blue-400 text-xs font-black uppercase mb-2">Common File Patterns</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <div>🔴 Critical: *.bak, *.backup, *.db, users.csv, config files</div>
              <div>🟠 High: *.zip, *.tar.gz, *.conf, *.env, *.sql</div>
              <div>🟡 Medium: *.log, *.php, *.js, *.py</div>
              <div>🟢 Low: *.txt, *.md, static files</div>
            </div>
          </div>
        </div>
      )}

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="space-y-3">
          <h3 className="text-blue-400 text-sm font-black uppercase">Discovered Files</h3>
          
          {currentListing ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentListing.files.map((file, index) => (
                <div key={index} className={`bg-black/40 border rounded p-3 ${getRiskBg(file.riskLevel)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <i className={`fas ${getFileIcon(file.type)} ${getRiskColor(file.riskLevel)}`}></i>
                      <h4 className="text-blue-400 font-bold text-sm">{file.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRiskColor(file.riskLevel)}`}>
                      {file.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-xs mb-2">{file.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Type: {file.type}</span>
                    <span>Path: {file.path}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExtractFile(file)}
                      disabled={isExtracting}
                      className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30 disabled:opacity-50"
                    >
                      <i className="fas fa-download mr-1"></i>Extract
                    </button>
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="px-2 py-1 bg-green-600/20 border border-green-600 text-green-400 text-xs rounded hover:bg-green-600/30"
                    >
                      <i className="fas fa-eye mr-1"></i>Details
                    </button>
                    <button
                      onClick={() => copyToClipboard(file.path)}
                      className="px-2 py-1 bg-purple-600/20 border border-purple-600 text-purple-400 text-xs rounded hover:bg-purple-600/30"
                    >
                      <i className="fas fa-copy mr-1"></i>Copy Path
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <i className="fas fa-folder-open text-4xl mb-2"></i>
              <p>No directory scanned yet</p>
              <p className="text-xs">Scan a directory to discover files</p>
            </div>
          )}
        </div>
      )}

      {/* Extraction Tab */}
      {activeTab === 'extraction' && (
        <div className="space-y-3">
          <h3 className="text-blue-400 text-sm font-black uppercase">File Extractions</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {extractions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <i className="fas fa-download text-4xl mb-2"></i>
                <p>No files extracted yet</p>
                <p className="text-xs">Extract files to view their content</p>
              </div>
            ) : (
              extractions.map((extraction, index) => (
                <div key={index} className={`bg-black/40 border rounded p-3 ${
                  extraction.success ? 'border-green-900/20' : 'border-red-900/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-blue-400 font-bold text-sm">{extraction.file.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      extraction.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {extraction.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Method: {extraction.method}</span>
                    <span>Size: {extraction.content.length} bytes</span>
                    <span>{extraction.timestamp.toLocaleTimeString()}</span>
                  </div>
                  
                  {extraction.success && extraction.content && (
                    <div className="bg-black/60 border border-blue-900/10 rounded p-2 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {extraction.content.length > 500 
                          ? extraction.content.substring(0, 500) + '...'
                          : extraction.content
                        }
                      </pre>
                    </div>
                  )}
                  
                  {extraction.error && (
                    <div className="text-xs text-red-400">
                      Error: {extraction.error}
                    </div>
                  )}
                  
                  {extraction.success && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => copyToClipboard(extraction.content)}
                        className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30"
                      >
                        <i className="fas fa-copy mr-1"></i>Copy Content
                      </button>
                      <button
                        onClick={() => copyToClipboard(fileDiscoveryService.generateExtractionCommands(extraction.file).join('\n'))}
                        className="px-2 py-1 bg-green-600/20 border border-green-600 text-green-400 text-xs rounded hover:bg-green-600/30"
                      >
                        <i className="fas fa-terminal mr-1"></i>Commands
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-3">
          <h3 className="text-blue-400 text-sm font-black uppercase">Analysis & Commands</h3>
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="bg-black/40 border border-blue-900/20 rounded p-3">
                <h4 className="text-blue-400 text-xs font-black uppercase mb-2">File Details</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-blue-400 ml-2">{selectedFile.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="text-blue-400 ml-2">{selectedFile.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Risk Level:</span>
                    <span className={`ml-2 font-bold ${getRiskColor(selectedFile.riskLevel)}`}>
                      {selectedFile.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Description:</span>
                    <span className="text-blue-400 ml-2">{selectedFile.description}</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-blue-900/20 rounded p-3">
                <h4 className="text-blue-400 text-xs font-black uppercase mb-2">Extraction Commands</h4>
                <div className="bg-black/60 border border-blue-900/10 rounded p-2">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {fileDiscoveryService.generateExtractionCommands(selectedFile).join('\n')}
                  </pre>
                </div>
                <button
                  onClick={() => copyToClipboard(fileDiscoveryService.generateExtractionCommands(selectedFile).join('\n'))}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded transition-all"
                >
                  <i className="fas fa-copy mr-1"></i>Copy Commands
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <i className="fas fa-chart-bar text-4xl mb-2"></i>
              <p>No file selected</p>
              <p className="text-xs">Select a file from the Files tab to see analysis</p>
            </div>
          )}
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-blue-900/20 rounded p-3">
        <h3 className="text-blue-400 text-xs font-black uppercase mb-2">System Logs</h3>
        <div
          ref={logsRef}
          className="bg-black/60 border border-blue-900/10 rounded p-2 h-32 overflow-y-auto font-mono text-xs text-gray-400"
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

export default FileDiscoveryTool;
