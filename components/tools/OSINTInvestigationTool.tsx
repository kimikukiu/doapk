import React, { useState, useEffect, useRef } from 'react';
import { osintEngine, Subject, InvestigationReport, MonitoringAlert } from '../../src/services/osintInvestigationEngine';

const OSINTInvestigationTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'reports' | 'monitoring' | 'analytics'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [reports, setReports] = useState<InvestigationReport[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const loadData = () => {
    setSubjects(osintEngine.getAllSubjects());
    setReports(osintEngine.getAllReports());
    setAlerts(osintEngine.getAlerts(20));
    setIsMonitoring(osintEngine['isMonitoring'] || false);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleAddSubject = () => {
    const name = prompt('Enter subject name:');
    if (!name) return;

    const type = prompt('Enter type (person/organization/location/financial):') as any;
    const riskLevel = prompt('Enter risk level (low/medium/high/critical):') as any;

    if (!name || !type || !riskLevel) return;

    const id = osintEngine.addSubject({
      name: name.trim(),
      type,
      status: 'active',
      riskLevel,
      metadata: {}
    });

    addLog(`Subject added: ${name} (${id})`);
    loadData();
  };

  const handleCreateReport = (subjectId: string) => {
    const title = prompt('Enter report title:');
    if (!title) return;

    const summary = prompt('Enter report summary:');
    if (!summary) return;

    const id = osintEngine.createReport(subjectId, {
      title: title.trim(),
      summary: summary.trim(),
      findings: [],
      evidence: [],
      riskScore: 50,
      status: 'draft'
    });

    addLog(`Report created: ${title} (${id})`);
    loadData();
  };

  const handleStartMonitoring = () => {
    osintEngine.startMonitoring(1); // Check every minute for demo
    setIsMonitoring(true);
    addLog('Monitoring started');
  };

  const handleStopMonitoring = () => {
    osintEngine.stopMonitoring();
    setIsMonitoring(false);
    addLog('Monitoring stopped');
  };

  const handleExportData = () => {
    const data = osintEngine.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Data exported');
  };

  const stats = osintEngine.getStatistics();

  return (
    <div className="p-4 space-y-4 bg-black border border-purple-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-purple-400 uppercase tracking-tighter">
          <i className="fas fa-search mr-2"></i>OSINT Investigation Engine
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
        <div className="bg-black/40 border border-purple-900/20 rounded p-2 text-center">
          <div className="text-purple-400 text-lg font-bold">{stats.subjects.total}</div>
          <div className="text-gray-500 text-xs">Subjects</div>
        </div>
        <div className="bg-black/40 border border-purple-900/20 rounded p-2 text-center">
          <div className="text-purple-400 text-lg font-bold">{stats.reports.total}</div>
          <div className="text-gray-500 text-xs">Reports</div>
        </div>
        <div className="bg-black/40 border border-purple-900/20 rounded p-2 text-center">
          <div className="text-purple-400 text-lg font-bold">{stats.alerts.total}</div>
          <div className="text-gray-500 text-xs">Alerts</div>
        </div>
        <div className="bg-black/40 border border-purple-900/20 rounded p-2 text-center">
          <div className="text-purple-400 text-lg font-bold">{stats.alerts.last24h}</div>
          <div className="text-gray-500 text-xs">24h Alerts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['subjects', 'reports', 'monitoring', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-xs font-black uppercase transition-all ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-black border border-purple-900/30 text-purple-400 hover:bg-purple-900/20'
            }`}
          >
            <i className={`fas fa-${tab === 'subjects' ? 'users' : tab === 'reports' ? 'file-alt' : tab === 'monitoring' ? 'satellite-dish' : 'chart-bar'} mr-1`}></i>
            {tab}
          </button>
        ))}
      </div>

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-purple-400 text-sm font-black uppercase">Investigation Subjects</h3>
            <button
              onClick={handleAddSubject}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase rounded transition-all"
            >
              <i className="fas fa-plus mr-1"></i>Add Subject
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subjects.map(subject => (
              <div key={subject.id} className="bg-black/40 border border-purple-900/20 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-purple-400 font-bold">{subject.name}</h4>
                    <p className="text-gray-500 text-xs">{subject.type} · {subject.status}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    subject.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                    subject.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    subject.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {subject.riskLevel.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateReport(subject.id)}
                    className="px-2 py-1 bg-purple-600/20 border border-purple-600 text-purple-400 text-xs rounded hover:bg-purple-600/30"
                  >
                    <i className="fas fa-file-alt mr-1"></i>Report
                  </button>
                  <button
                    onClick={() => setSelectedSubject(subject)}
                    className="px-2 py-1 bg-blue-600/20 border border-blue-600 text-blue-400 text-xs rounded hover:bg-blue-600/30"
                  >
                    <i className="fas fa-eye mr-1"></i>Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          <h3 className="text-purple-400 text-sm font-black uppercase">Investigation Reports</h3>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reports.map(report => {
              const subject = subjects.find(s => s.id === report.subjectId);
              return (
                <div key={report.id} className="bg-black/40 border border-purple-900/20 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-purple-400 font-bold">{report.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      report.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      report.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {report.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">{report.summary}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Subject: {subject?.name || 'Unknown'}</span>
                    <span>Risk Score: {report.riskScore}/100</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-purple-400 text-sm font-black uppercase">Monitoring System</h3>
            <div className="flex gap-2">
              {!isMonitoring ? (
                <button
                  onClick={handleStartMonitoring}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all"
                >
                  <i className="fas fa-play mr-1"></i>Start
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
            {alerts.map(alert => {
              const subject = subjects.find(s => s.id === alert.subjectId);
              return (
                <div key={alert.id} className="bg-black/40 border border-purple-900/20 rounded p-2">
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
                  
                  <p className="text-gray-300 text-sm">{alert.message}</p>
                  <p className="text-gray-500 text-xs">Subject: {subject?.name || 'Unknown'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-3">
          <h3 className="text-purple-400 text-sm font-black uppercase">Analytics Dashboard</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-purple-900/20 rounded p-3">
              <h4 className="text-purple-400 text-xs font-black uppercase mb-2">Subjects by Type</h4>
              {Object.entries(stats.subjects.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="text-gray-400 capitalize">{type}</span>
                  <span className="text-purple-400 font-bold">{count as number}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-black/40 border border-purple-900/20 rounded p-3">
              <h4 className="text-purple-400 text-xs font-black uppercase mb-2">Risk Distribution</h4>
              {Object.entries(stats.subjects.byRiskLevel).map(([level, count]) => (
                <div key={level} className="flex justify-between text-xs">
                  <span className="text-gray-400 capitalize">{level}</span>
                  <span className="text-purple-400 font-bold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase rounded transition-all"
            >
              <i className="fas fa-download mr-1"></i>Export Data
            </button>
            <button
              onClick={() => { osintEngine.clearAlerts(); loadData(); addLog('Alerts cleared'); }}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all"
            >
              <i className="fas fa-trash mr-1"></i>Clear Alerts
            </button>
          </div>
        </div>
      )}

      {/* System Logs */}
      <div className="bg-black/40 border border-purple-900/20 rounded p-3">
        <h3 className="text-purple-400 text-xs font-black uppercase mb-2">System Logs</h3>
        <div
          ref={logsRef}
          className="bg-black/60 border border-purple-900/10 rounded p-2 h-24 overflow-y-auto font-mono text-xs text-gray-400"
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

export default OSINTInvestigationTool;
