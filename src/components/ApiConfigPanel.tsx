import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider } from '../../types';
import { getAIConfig, setAIConfig, getActiveApiKey } from '../services/aiService';

const ApiConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>(getAIConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const providers: { value: AIProvider; label: string; icon: string; color: string }[] = [
    { value: 'openrouter', label: 'OpenRouter', icon: 'fa-route', color: 'text-orange-500' },
    { value: 'openai', label: 'OpenAI', icon: 'fa-robot', color: 'text-green-500' },
    { value: 'anthropic', label: 'Anthropic', icon: 'fa-brain', color: 'text-purple-500' },
    { value: 'gemini', label: 'Gemini', icon: 'fa-gem', color: 'text-blue-500' },
    { value: 'mistral', label: 'Mistral', icon: 'fa-wind', color: 'text-cyan-500' },
    { value: 'llama', label: 'Llama', icon: 'fa-horse', color: 'text-yellow-500' },
    { value: 'deepseek', label: 'DeepSeek', icon: 'fa-search', color: 'text-red-500' },
    { value: 'lisp', label: 'LISP Engine', icon: 'fa-code', color: 'text-emerald-500' },
    { value: 'milspec', label: 'MIL-SPEC', icon: 'fa-shield', color: 'text-gray-500' },
  ];

  useEffect(() => {
    const checkConnection = () => {
      const apiKey = getActiveApiKey();
      setIsConnected(!!apiKey || config.provider === 'lisp' || config.provider === 'milspec');
    };
    checkConnection();
  }, [config]);

  const updateConfig = (updates: Partial<AIConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    setAIConfig(newConfig);
  };

  const getProviderIcon = (provider: AIProvider) => {
    const p = providers.find(p => p.value === provider);
    return p ? p.icon : 'fa-plug';
  };

  const getProviderColor = (provider: AIProvider) => {
    const p = providers.find(p => p.value === provider);
    return p ? p.color : 'text-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-emerald-400 font-bold text-sm">AI CONNECTION STATUS</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-xs font-bold ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs">
          <i className={`fas ${getProviderIcon(config.provider)} ${getProviderColor(config.provider)}`}></i>
          <span className="text-gray-400">Provider:</span>
          <span className="text-white font-bold">{providers.find(p => p.value === config.provider)?.label}</span>
        </div>
      </div>

      {/* API Provider Selection */}
      <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-4">
        <h3 className="text-emerald-400 font-bold text-sm mb-3">AI PROVIDERS</h3>
        <div className="grid grid-cols-3 gap-2">
          {providers.map((provider) => (
            <button
              key={provider.value}
              onClick={() => updateConfig({ provider: provider.value })}
              className={`p-2 rounded border transition-all flex flex-col items-center gap-1 ${
                config.provider === provider.value
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <i className={`fas ${provider.icon} ${provider.color} text-lg`}></i>
              <span className="text-xs text-gray-300">{provider.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* API Key Configuration */}
      {config.provider !== 'lisp' && config.provider !== 'milspec' && (
        <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-4">
          <h3 className="text-emerald-400 font-bold text-sm mb-3">API KEY CONFIGURATION</h3>
          
          <div className="space-y-3">
            {/* OpenRouter Key */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">OpenRouter API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.openrouterKey}
                  onChange={(e) => updateConfig({ openrouterKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 hover:text-white"
                >
                  <i className={`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* OpenAI Key */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">OpenAI API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.openaiKey}
                  onChange={(e) => updateConfig({ openaiKey: e.target.value })}
                  placeholder="sk-..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Gemini Key */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Gemini API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.geminiKey}
                  onChange={(e) => updateConfig({ geminiKey: e.target.value })}
                  placeholder="AIza..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Anthropic Key */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Anthropic API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.anthropicKey}
                  onChange={(e) => updateConfig({ anthropicKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Mistral Key */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Mistral API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.mistralKey}
                  onChange={(e) => updateConfig({ mistralKey: e.target.value })}
                  placeholder="..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Llama Key */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Llama API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.llamaKey}
                  onChange={(e) => updateConfig({ llamaKey: e.target.value })}
                  placeholder="..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* DeepSeek Key */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">DeepSeek API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.deepseekKey}
                  onChange={(e) => updateConfig({ deepseekKey: e.target.value })}
                  placeholder="sk-..."
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Settings */}
      <div className="bg-black/40 border border-emerald-500/20 rounded-lg p-4">
        <h3 className="text-emerald-400 font-bold text-sm mb-3">RESPONSE PRIORITY</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="rounded border-gray-700 bg-gray-800 text-emerald-500"
            />
            <span>Quantum Intelligence (Primary - Always First)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={isConnected}
              disabled
              className="rounded border-gray-700 bg-gray-800 text-emerald-500"
            />
            <span>External API (Secondary)</span>
          </label>
        </div>
        <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded">
          <p className="text-xs text-emerald-400">
            <i className="fas fa-info-circle mr-1"></i>
            Quantum Intelligence responds first even when APIs are configured
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigPanel;
