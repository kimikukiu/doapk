import React, { useState, useEffect, useRef } from 'react';
import { investigationAI, AITask, AIResult, AI_PROVIDERS } from '../../src/services/investigationAIEngine';

const InvestigationAITool: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [results, setResults] = useState<AIResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-load API key from localStorage
    const savedKey = localStorage.getItem('investigation_ai_key');
    if (savedKey) {
      setApiKey(savedKey);
      investigationAI.updateApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('investigation_ai_key', newKey);
    investigationAI.updateApiKey(newKey);
    const info = investigationAI.getProviderInfo();
    addLog(`API Key updated - Provider: ${info.provider} | Model: ${info.model}`);
  };

  const addTask = () => {
    if (!prompt.trim()) {
      addLog('ERROR: Prompt cannot be empty');
      return;
    }

    const taskId = investigationAI.addTask({
      prompt: prompt.trim(),
      context: context.trim() || undefined,
      priority,
    });

    addLog(`Task queued: ${taskId} (${priority} priority)`);
    setPrompt('');
    setContext('');
  };

  const processQueue = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    addLog('Starting queue processing...');
    
    try {
      await investigationAI.processQueue();
      const allResults = investigationAI.getAllResults();
      setResults(allResults);
      addLog(`Queue processing complete - ${allResults.length} results`);
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    investigationAI.clearResults();
    setResults([]);
    setLogs([]);
    addLog('Results cleared');
  };

  const providerInfo = investigationAI.getProviderInfo();

  return (
    <div className="p-4 space-y-4 bg-black border border-cyan-900/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-cyan-400 uppercase tracking-tighter">
          <i className="fas fa-search mr-2"></i>Investigation AI Engine
        </h2>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            providerInfo.hasKey ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {providerInfo.provider.toUpperCase()} · {providerInfo.model}
          </span>
        </div>
      </div>

      {/* API Key Input */}
      <div className="bg-black/40 border border-cyan-900/20 rounded-lg p-3">
        <label className="text-cyan-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-key mr-1"></i>API Key (Auto-detects provider)
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={e => handleApiKeyChange(e.target.value)}
          placeholder="Enter API key (Google, Anthropic, Groq, OpenAI, OpenRouter)..."
          className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-sm outline-none focus:border-cyan-500/50"
        />
        <div className="mt-2 grid grid-cols-5 gap-1 text-xs">
          {AI_PROVIDERS.map(provider => (
            <div key={provider.name} className="text-gray-600 text-center p-1 bg-black/30 rounded">
              <div className="font-bold">{provider.name.toUpperCase()}</div>
              <div className="text-[8px]">{provider.keyPattern}*</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Input */}
      <div className="bg-black/40 border border-cyan-900/20 rounded-lg p-3">
        <label className="text-cyan-400 text-xs font-black uppercase block mb-2">
          <i className="fas fa-terminal mr-1"></i>Investigation Prompt
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter investigation prompt..."
          className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-sm outline-none focus:border-cyan-500/50 h-20 resize-none"
        />
        
        <div className="mt-2">
          <label className="text-cyan-400 text-xs font-black uppercase block mb-1">
            <i className="fas fa-layer-group mr-1"></i>Context (Optional)
          </label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Additional context for the AI..."
            className="w-full bg-black border border-cyan-900/30 rounded px-3 py-2 text-cyan-400 font-mono text-xs outline-none focus:border-cyan-500/50 h-12 resize-none"
          />
        </div>

        <div className="mt-3 flex items-center gap-4">
          <div>
            <label className="text-cyan-400 text-xs font-black uppercase block mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="bg-black border border-cyan-900/30 rounded px-2 py-1 text-cyan-400 font-mono text-xs outline-none focus:border-cyan-500/50"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <button
            onClick={addTask}
            disabled={!prompt.trim() || !providerInfo.hasKey}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black uppercase rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-plus mr-1"></i>Queue Task
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={processQueue}
          disabled={isProcessing || !providerInfo.hasKey}
          className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1"></i>Processing...
            </>
          ) : (
            <>
              <i className="fas fa-play mr-1"></i>Process Queue
            </>
          )}
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded transition-all"
        >
          <i className="fas fa-trash mr-1"></i>Clear
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-black/40 border border-cyan-900/20 rounded-lg p-3">
          <h3 className="text-cyan-400 text-xs font-black uppercase mb-2">
            <i className="fas fa-chart-bar mr-1"></i>Results ({results.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.map(result => (
              <div key={result.id} className="bg-black/60 border border-cyan-900/10 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-cyan-400 text-xs font-mono">{result.id}</span>
                  <span className="text-gray-500 text-xs">
                    {result.provider} · {result.tokens || 0} tokens
                  </span>
                </div>
                <div className="text-gray-300 text-xs whitespace-pre-wrap font-mono">
                  {result.response || result.error}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-black/40 border border-cyan-900/20 rounded-lg p-3">
        <h3 className="text-cyan-400 text-xs font-black uppercase mb-2">
          <i className="fas fa-terminal mr-1"></i>System Logs
        </h3>
        <div
          ref={logsRef}
          className="bg-black/60 border border-cyan-900/10 rounded p-2 h-32 overflow-y-auto font-mono text-xs text-gray-400"
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

export default InvestigationAITool;
