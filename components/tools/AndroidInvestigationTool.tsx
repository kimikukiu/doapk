import React, { useState, useEffect, useRef } from 'react';
import { androidEngine, AndroidDevice, SecurityAlert, ForensicArtifact } from '../../src/services/androidInvestigationEngine';

const AndroidInvestigationTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'devices' | 'artifacts' | 'alerts' | 'analysis'>('devices');
  const [devices, setDevices] = useState<AndroidDevice[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [artifacts, setArtifacts] = useState<ForensicArtifact[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<AndroidDevice | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const loadData = () => {
    setDevices(androidEngine.getAllDevices());
    setAlerts(androidEngine.getAlerts(undefined, 'critical'));
    setArtifacts(androidEngine.getArtifacts(undefined, 'call_log'));
    setIsMonitoring(androidEngine['isMonitoring'] || false);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleAddDevice = () => {
    const deviceId = prompt('Enter device ID:');
    if (!deviceId) return;

    const model = prompt('Enter device model:') || 'Unknown';
    const osVersion = prompt('Enter OS version:') || 'Android';

    const id = androidEngine.addDevice({
      deviceId: deviceId.trim(),
      model: model.trim(),
      osVersion: osVersion.trim(),
      status: 'offline',
      apps: [],
      permissions: [],
      metadata: {}
    });

    addLog(`Device added: ${model} (${id})`);
    loadData();
  };

  const handleStartMonitoring = () => {
    androidEngine.startMonitoring(1); // Check every minute for demo
    setIsMonitoring(true);
    addLog('Android monitoring started');
  };

  const handleStopMonitoring = () => {
    androidEngine.stopMonitoring();
    setIsMonitoring(false);
    addLog('Android monitoring stopped');
  };

  const handleAnalyzeDevice = (deviceId: string) => {
    const analysis = androidEngine.analyzeDeviceSecurity(deviceId);
    if (analysis) {
      addLog(`Analysis complete for ${analysis.device.model} - Risk Score: ${analysis.riskScore}`);
      setSelectedDevice(analysis.device);
      setActiveTab('analysis');
    }
  };

  const handleExportDevice = (deviceId: string) => {
    const data = androidEngine.exportDeviceData(deviceId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `android_device_${deviceId}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(`Device data exported: ${deviceId}`);
  };

  const stats = androidEngine.getStatistics();

  return (
    <div className="p-4 space-y-4 bg-black border border-green-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-green-400 uppercase tracking-tighter">
          <i className="fas fa-mobile-alt mr-2"></i>Android Investigation Engine
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isMonitoring ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {isMonitoring ? 'MONITORING' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-black/40 border border-green-900/20 rounded p-2 text-center">
          <div className="text-green-400 text-lg font-bold">{stats.devices.total}</div>
          <div className="text-gray-500 text-xs">Devices</div>
        </div>
        <div className="bg-black/40 border border-green-900/20 rounded p-2 text-center">
          <div className="text-green-400 text-lg font-bold">{stats.devices.online}</div>
          <div className="text-gray-500 text-xs">Online</div>
        </div>
        <div className="bg-black/40 border border-green-900/20 rounded p-2 text-center">
          <div className="text-green-400 text-lg font-bold">{stats.devices.compromised}</div>
          <div className="text-gray-500 text-xs">Compromised</div>
        </div>
        <div className="bg-black/40 border border-green-900/20 rounded p-2 text-center">
          <div className="text-green-400 text-lg font-bold">{stats.alerts.total}</div>
          <div className="text-gray-500 text-xs">Alerts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['devices', 'artifacts', 'alerts', 'analysis'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-xs font-black uppercase transition-all ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'bg-black border border-green-900/30 text-green-400 hover:bg-green-900/20'
            }`}
          >
            <i className={`fas fa-${tab === 'devices' ? 'mobile-alt' : tab === 'artifacts' ? 'database' : tab === 'alerts' ? 'exclamation-triangle' : 'chart-line'} mr-1`}></i>
            {tab}
          </button>
        ))}
      </div>

      {/* Devices Tab */}
      {activeTab === 'devices' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-green-400 text-sm font-black uppercase">Android Devices</h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddDevice}
                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all"
              >
                <i className="fas fa-plus mr-1"></i>Add Device
              </button>
              {!isMonitoring ? (
                <button
                  onClick={handleStartMonitoring}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all"
                >
                  <i className="fas fa-play mr-1"></i>Monitor
                </button>
              ) : (
                <button
                  onClick={handleStopMonitoring}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all"
                >
                  <i className="fas fa-stop mr-1"></i>Stop
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {devices.map(device => (
              <div key={device.id} className="bg-black/40 border border-green-900/20 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-green-400 font-bold">{device.model}</h4>
                    <p className="text-gray-500 text-xs">{device.osVersion} · {device.deviceId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    device.status === 'compromised' ? 'bg-red-500/20 text-red-400' :
                    device.status === 'online' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {device.status.toUpperCase()}
                  </span>
                </div>
                
                {device.location && (
                  <div className="text-xs text-gray-400 mb-2">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
                    <span className="ml-2">({device.location.source})</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Apps: {device.apps.length} ({device.apps.filter(a => a.riskLevel === 'critical').length} critical)</span>
                  <span>Permissions: {device.permissions.length}</span>
                  <span>Last seen: {device.lastSeen.toLocaleTimeString()}</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAnalyzeDevice(device.id)}
                    className="px-2 py-1 bg-green-600/20 border border-green-600 text-green-400 text-xs rounded hover:bg-green-600/30"
                  >
                    <i className="fas fa-search mr-1"></i>Analyze
                  </button>
                  <button
                    onClick={() => handleExportDevice(device.id)}
                    className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30"
                  >
                    <i className="fas fa-download mr-1"></i>Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Artifacts Tab */}
      {activeTab === 'artifacts' && (
        <div className="space-y-3">
          <h3 className="text-green-400 text-sm font-black uppercase">Forensic Artifacts</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {artifacts.map(artifact => (
              <div key={artifact.id} className="bg-black/40 border border-green-900/20 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-400 font-bold text-xs capitalize">{artifact.type}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(artifact.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-300 text-xs">Device: {artifact.deviceId}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          <h3 className="text-green-400 text-sm font-black uppercase">Security Alerts</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map(alert => {
              const device = devices.find(d => d.id === alert.deviceId);
              return (
                <div key={alert.id} className="bg-black/40 border border-green-900/20 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <h4 className="text-green-400 font-bold text-sm">{alert.title}</h4>
                  <p className="text-gray-300 text-xs">{alert.description}</p>
                  <p className="text-gray-500 text-xs">Device: {device?.model || 'Unknown'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-3">
          <h3 className="text-green-400 text-sm font-black uppercase">Security Analysis</h3>
          
          {selectedDevice ? (
            <div className="bg-black/40 border border-green-900/20 rounded p-3">
              <h4 className="text-green-400 font-bold mb-2">{selectedDevice.model}</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-bold ${
                    selectedDevice.status === 'compromised' ? 'text-red-400' :
                    selectedDevice.status === 'online' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    {selectedDevice.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Critical Apps:</span>
                  <span className="text-red-400 font-bold">
                    {selectedDevice.apps.filter(a => a.riskLevel === 'critical').length}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Suspicious Apps:</span>
                  <span className="text-orange-400 font-bold">
                    {selectedDevice.apps.filter(a => a.category === 'suspicious' || a.category === 'malicious').length}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">High-Risk Permissions:</span>
                  <span className="text-yellow-400 font-bold">
                    {selectedDevice.permissions.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handleAnalyzeDevice(selectedDevice.id)}
                className="w-full mt-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all"
              >
                <i className="fas fa-sync-alt mr-1"></i>Refresh Analysis
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <i className="fas fa-mobile-alt text-4xl mb-2"></i>
              <p>Select a device to view analysis</p>
            </div>
          )}
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-green-900/20 rounded p-3">
        <h3 className="text-green-400 text-xs font-black uppercase mb-2">System Logs</h3>
        <div
          ref={logsRef}
          className="bg-black/60 border border-green-900/10 rounded p-2 h-24 overflow-y-auto font-mono text-xs text-gray-400"
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

export default AndroidInvestigationTool;
