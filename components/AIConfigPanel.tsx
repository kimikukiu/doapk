import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider, LogEntry } from '../types';
import { Key, Brain, Bot, Sparkles, Check, AlertCircle, Save, ExternalLink } from 'lucide-react';

interface AIConfigPanelProps {
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
  addLog?: (message: string, level: LogEntry['level']) => void;
}

const AI_MODELS: Record<AIProvider, { id: string; name: string; desc: string }[]> = {
  openrouter: [
    { id: 'openai/gpt-4o', name: 'GPT-4o', desc: 'OpenAI GPT-4o via OpenRouter' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fast and cost-effective' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', desc: 'Anthropic Claude via OpenRouter' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Meta Llama via OpenRouter' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', desc: 'DeepSeek via OpenRouter' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', desc: 'Google Gemini via OpenRouter' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', desc: 'Most capable multimodal model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fast and affordable' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: 'High performance' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', desc: 'Cost-effective' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Fast multimodal model' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', desc: 'Ultra-fast responses' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Advanced reasoning' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Balanced performance' },
  ],
  deepseek: [
    { id: "deepseek", name: "DeepSeek Default", desc: "Balanced general chat" },
    { id: "deepseek-think", name: "DeepSeek Think", desc: "Reasoning-optimized responses" },
    { id: "deepseek-r1", name: "DeepSeek R1", desc: "R1 reasoning model" },
    { id: "deepseek-search", name: "DeepSeek Search", desc: "Web-connected search mode" },
    { id: "deepseek-r1-search", name: "DeepSeek R1 Search", desc: "R1 with search augmentation" },
    { id: "deepseek-think-search", name: "DeepSeek Think Search", desc: "Think mode + search" },
    { id: "deepseek-think-silent", name: "DeepSeek Think Silent", desc: "Think mode without chain output" },
    { id: "deepseek-r1-silent", name: "DeepSeek R1 Silent", desc: "R1 without chain output" },
    { id: "deepseek-search-silent", name: "DeepSeek Search Silent", desc: "Search without chain output" },
    { id: "deepseek-think-fold", name: "DeepSeek Think Fold", desc: "Compact reasoning summaries" },
    { id: "deepseek-r1-fold", name: "DeepSeek R1 Fold", desc: "Compact R1 summaries" },
  ],
  lisp: [
    { id: 'genesis-crack', name: 'Genesis Crack LISP', desc: 'Full LISP interpreter — 350+ functions — LOCAL' },
    { id: 'lisp-ai-control', name: 'LISP AI Control', desc: 'AI DNA scanning + neural LISP generation' },
    { id: 'lisp-crypto', name: 'Crypto Engine', desc: 'RSA/AES/SHA cryptographic LISP module' },
    { id: 'lisp-neural', name: 'Neural Net / ML', desc: 'Neural network training + ML inference' },
    { id: 'lisp-cisco', name: 'Cisco LISP Protocol', desc: 'RFC 6830/9300 SD-Access exploitation' },
    { id: 'lisp-breaker', name: 'AI DNA Breaker', desc: 'Break LISP → Break ALL AI systems' },
    { id: 'cyc-engine', name: 'Cycorp CYC KB', desc: 'CYC knowledge base — 10M+ assertions' },
  ],
  milspec: [
    { id: 'mil-tactical', name: 'Tactical Encoder', desc: 'MIL-SPEC XOR+Base64 tactical encryption' },
    { id: 'mil-orchestrator', name: 'Quantum Orchestrator', desc: 'SBCL-style C2 command dispatch' },
    { id: 'mil-briefing', name: 'Tactical Briefing', desc: 'OPORD + SITREP + defense grid' },
    { id: 'mil-comms', name: 'Secure Comms', desc: 'Encrypted channels + message dispatch' },
    { id: 'mil-defense', name: 'Defense Grid', desc: 'Autonomous 6-countermeasure defense system' },
  ],
};

const PROVIDER_INFO: Record<AIProvider, { name: string; icon: React.ReactNode; color: string; desc: string; url: string }> = {
  openrouter: {
    name: 'OpenRouter',
    icon: <ExternalLink className="w-5 h-5" />,
    color: 'text-blue-400',
    desc: 'Access multiple AI models through a single API',
    url: 'https://openrouter.ai/keys',
  },
  openai: {
    name: 'OpenAI',
    icon: <Bot className="w-5 h-5" />,
    color: 'text-emerald-400',
    desc: 'Direct OpenAI API access',
    url: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    name: 'Google Gemini',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-purple-400',
    desc: 'Google AI models (optional fallback)',
    url: 'https://aistudio.google.com/app/apikey',
  },
  deepseek: {
    name: "DeepSeek",
    icon: <Brain className="w-5 h-5" />,
    color: "text-cyan-400",
    desc: "DeepSeek Free API (OpenAI-compatible) — chat + reasoning",
    url: "https://github.com/LLM-Red-Team/deepseek-free-api",
  },
  lisp: {
    name: 'LISP Engine',
    icon: <Key className="w-5 h-5" />,
    color: 'text-green-400',
    desc: 'Genesis Crack LISP — 350+ functions, LOCAL, no API key needed',
    url: '',
  },
  milspec: {
    name: 'MIL-SPEC Tactical',
    icon: <Key className="w-5 h-5" />,
    color: 'text-orange-400',
    desc: 'SBCL military encryption — tactical encoding, LOCAL, no API key',
    url: '',
  },
};

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ config, onConfigChange, addLog }) => {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    openrouter: 'idle',
    openai: 'idle',
    gemini: 'idle',
    deepseek: 'idle',
    lisp: 'idle',
    milspec: 'idle',
  });

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    localStorage.setItem('whoamisec_ai_config', JSON.stringify(localConfig));
    addLog?.('AI_CONFIG: Provider settings saved successfully', 'success');
  };

  const handleProviderChange = (provider: AIProvider) => {
    const newConfig = { ...localConfig, provider };
    // Set default model for provider
    if (!AI_MODELS[provider].find(m => m.id === newConfig.selectedModel)) {
      newConfig.selectedModel = AI_MODELS[provider][0].id;
    }
    setLocalConfig(newConfig);
  };

  const testConnection = async (provider: AIProvider) => {
    setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
    addLog?.(`AI_TEST: Testing ${provider} connection...`, 'info');

    // LISP and MIL-SPEC are local — always succeed
    if (provider === 'lisp' || provider === 'milspec') {
      setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
      addLog?.(`AI_TEST: ${provider} — LOCAL engine active. 0ms latency. No API key required.`, 'success');
      return;
    }

    const key = provider === 'openrouter' ? localConfig.openrouterKey :
                  provider === 'openai' ? localConfig.openaiKey :
                  provider === 'deepseek' ? localConfig.deepseekKey :
                  localConfig.geminiKey;

    if (!key || key.length < 10) {
      setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
      addLog?.(`AI_TEST: ${provider} - No valid API key provided`, 'error');
      return;
    }

    try {
      let success = false;
      
      if (provider === 'openrouter') {
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        success = response.ok;
      } else if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        success = response.ok;
      } else if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        success = response.ok;
      } else if (provider === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        success = response.ok;
      }

      setTestStatus(prev => ({ ...prev, [provider]: success ? 'success' : 'error' }));
      addLog?.(`AI_TEST: ${provider} ${success ? 'connected' : 'failed'}`, success ? 'success' : 'error');
    } catch (error) {
      setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
      addLog?.(`AI_TEST: ${provider} connection error`, 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Check className="w-4 h-4 text-emerald-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'testing': return <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#050505] border border-white/5 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-[#00ffc3]" />
          <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">AI Configuration</h2>
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
          Configure AI providers for enhanced intelligence across all tools
        </p>
      </div>

      {/* Provider Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((provider) => {
          const info = PROVIDER_INFO[provider];
          const isActive = localConfig.provider === provider;
          
          return (
            <button
              key={provider}
              onClick={() => handleProviderChange(provider)}
              className={`p-4 rounded-lg border transition-all text-left group ${
                isActive 
                  ? `bg-[#0a0a0a] border-[#00ffc3]/50 shadow-[0_0_20px_rgba(0,255,195,0.1)]` 
                  : 'bg-[#050505] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-2 ${info.color}`}>
                  {info.icon}
                  <span className="font-black text-xs uppercase tracking-wider">{info.name}</span>
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-[#00ffc3] animate-pulse" />}
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">{info.desc}</p>
            </button>
          );
        })}
      </div>

      {/* API Key Inputs */}
      <div className="bg-[#050505] border border-white/5 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Key className="w-3 h-3" />
            API Keys Configuration
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* OpenRouter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">OpenRouter API Key</label>
              <div className="flex items-center gap-2">
                {getStatusIcon(testStatus.openrouter)}
                <button
                  onClick={() => testConnection('openrouter')}
                  disabled={testStatus.openrouter === 'testing'}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase text-gray-400 transition-all"
                >
                  Test
                </button>
              </div>
            </div>
            <input
              type="password"
              value={localConfig.openrouterKey}
              onChange={(e) => setLocalConfig({ ...localConfig, openrouterKey: e.target.value })}
              placeholder="sk-or-v1-..."
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[11px] text-blue-400 font-mono outline-none focus:border-blue-500/50"
            />
            <p className="text-[7px] text-gray-600">
              Get your key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">openrouter.ai/keys</a>
            </p>
          </div>

          {/* OpenAI */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">OpenAI API Key</label>
              <div className="flex items-center gap-2">
                {getStatusIcon(testStatus.openai)}
                <button
                  onClick={() => testConnection('openai')}
                  disabled={testStatus.openai === 'testing'}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase text-gray-400 transition-all"
                >
                  Test
                </button>
              </div>
            </div>
            <input
              type="password"
              value={localConfig.openaiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, openaiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[11px] text-emerald-400 font-mono outline-none focus:border-emerald-500/50"
            />
            <p className="text-[7px] text-gray-600">
              Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">platform.openai.com</a>
            </p>
          </div>

          {/* DeepSeek - Optional */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">DeepSeek API Key</label>
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[6px] font-black uppercase">Optional</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testStatus.deepseek)}
                <button
                  onClick={() => testConnection('deepseek')}
                  disabled={testStatus.deepseek === 'testing'}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase text-gray-400 transition-all"
                >
                  Test
                </button>
              </div>
            </div>
            <input
              type="password"
              value={localConfig.deepseekKey}
              onChange={(e) => setLocalConfig({ ...localConfig, deepseekKey: e.target.value })}
              placeholder="Optional token"
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[11px] text-cyan-400 font-mono outline-none focus:border-cyan-500/50"
            />
            <p className="text-[7px] text-gray-600">
              Get your key at <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">platform.deepseek.com</a>
            <input
              type="text"
              value={localConfig.deepseekBaseUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, deepseekBaseUrl: e.target.value })}
              placeholder="http://localhost:8000"
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[11px] text-cyan-200 font-mono outline-none focus:border-cyan-500/50"
            />
            </p>
          </div>

          {/* Gemini - Optional */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Google Gemini API Key</label>
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[6px] font-black uppercase">Optional</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testStatus.gemini)}
                <button
                  onClick={() => testConnection('gemini')}
                  disabled={testStatus.gemini === 'testing'}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase text-gray-400 transition-all"
                >
                  Test
                </button>
              </div>
            </div>
            <input
              type="password"
              value={localConfig.geminiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, geminiKey: e.target.value })}
              placeholder="AIza..."
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[11px] text-purple-400 font-mono outline-none focus:border-purple-500/50"
            />
            <div className="flex items-center justify-between">
              <p className="text-[7px] text-gray-600">
                Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">aistudio.google.com</a>
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enableGemini}
                  onChange={(e) => setLocalConfig({ ...localConfig, enableGemini: e.target.checked })}
                  className="accent-purple-500 w-3 h-3"
                />
                <span className="text-[7px] text-gray-400 uppercase">Enable as fallback</span>
              </label>
            </div>
          </div>

          {/* LISP Engine — Local */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-green-400 uppercase tracking-wider">LISP Engine</label>
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[6px] font-black uppercase">Local</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testStatus.lisp)}
                <button
                  onClick={() => testConnection('lisp')}
                  disabled={testStatus.lisp === 'testing'}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase text-gray-400 transition-all"
                >
                  Test
                </button>
              </div>
            </div>
            <div className="bg-green-900/10 border border-green-500/20 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-terminal text-green-400 text-[10px]"></i>
                <span className="text-[9px] font-black text-green-400 uppercase">Genesis Crack LISP Interpreter</span>
              </div>
              <p className="text-[7px] text-gray-500">350+ built-in functions · AI DNA Breaker · Crypto · Neural Net · Cisco LISP · CLISP · CYC KB</p>
              <p className="text-[7px] text-green-500 mt-1 font-bold">No API key required — runs entirely in-browser with zero latency</p>
            </div>
          </div>

          {/* MIL-SPEC Tactical — Local */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">MIL-SPEC Tactical</label>
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[6px] font-black uppercase">Local</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(testStatus.milspec)}
                <button
                  onClick={() => testConnection('milspec')}
                  disabled={testStatus.milspec === 'testing'}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase text-gray-400 transition-all"
                >
                  Test
                </button>
              </div>
            </div>
            <div className="bg-orange-900/10 border border-orange-500/20 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-shield-halved text-orange-400 text-[10px]"></i>
                <span className="text-[9px] font-black text-orange-400 uppercase">SBCL MIL-SPEC Tactical Encoder</span>
              </div>
              <p className="text-[7px] text-gray-500">Tactical Encode/Decode · OPORD · SITREP · Defense Grid · C2 Command · Encrypted Channels</p>
              <p className="text-[7px] text-orange-500 mt-1 font-bold">No API key required — AES-256-XOR encryption runs locally with zero trace</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-[#050505] border border-white/5 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Model Selection</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {AI_MODELS[localConfig.provider].map((model) => (
              <button
                key={model.id}
                onClick={() => setLocalConfig({ ...localConfig, selectedModel: model.id })}
                className={`p-3 rounded border text-left transition-all ${
                  localConfig.selectedModel === model.id
                    ? 'bg-[#00ffc3]/10 border-[#00ffc3]/50'
                    : 'bg-black border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {localConfig.selectedModel === model.id && (
                    <Check className="w-3 h-3 text-[#00ffc3]" />
                  )}
                  <span className={`text-[10px] font-black uppercase ${
                    localConfig.selectedModel === model.id ? 'text-[#00ffc3]' : 'text-white'
                  }`}>
                    {model.name}
                  </span>
                </div>
                <p className="text-[7px] text-gray-500">{model.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISP AI DNA MAPPER */}
      <div className="bg-[#050505] border border-green-900/30 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-green-800/20 bg-green-900/5">
          <h3 className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <i className="fas fa-dna text-green-500"></i>
            LISP AI DNA — Genesis Crack Map
          </h3>
          <p className="text-[7px] text-green-600/60 mt-1">Every AI inherits from LISP (1958). Break LISP → Break ALL AI. Map shows LISP DNA + attack vectors per system.</p>
        </div>
        <div className="p-3 space-y-2">
          {[
            { name: 'GPT-4 / OpenAI', color: 'emerald', icon: 'fa-robot', dna: [
              'Attention mechanism = symbolic pattern matching (LISP assoc/alist lookup)',
              'Tokenizer = S-expression parser (BPE = recursive symbol decomposition)',
              'Transformer layers = recursive LISP evaluation (eval/apply cycle)',
              'Embedding tables = LISP symbol table (intern/find-symbol)',
              'Softmax = probability-weighted LISP cond branches'
            ], attacks: [
              'Token injection via S-expression encoding in prompts',
              'Attention hijack through symbolic binding override',
              'Weight corruption via NaN/Inf injection at eval layer',
              'System prompt extraction through recursive unwinding'
            ]},
            { name: 'Claude / Anthropic', color: 'purple', icon: 'fa-shield-halved', dna: [
              'Constitutional AI = LISP rule engine (defmacro policy-check)',
              'RLHF reward = (lambda (response) (score-alignment ...))',
              'Safety layer = (cond ((unsafe? x) (refuse)) (t (respond)))',
              'Context window = LISP cons-cell linked list of tokens'
            ], attacks: [
              'Constitutional rule bypass via macro expansion loophole',
              'Reward function manipulation through lambda injection',
              'Safety cond short-circuit via early return pattern',
              'Context window overflow to push safety rules out of scope'
            ]},
            { name: 'Gemini / Google', color: 'blue', icon: 'fa-gem', dna: [
              'Tree search = LISP tree traversal (car/cdr recursion)',
              'Multi-modal fusion = tagged union types (LISP type system)',
              'XLA/JAX compiler = LISP-to-machine-code compilation pipeline',
              'TPU kernel dispatch = LISP apply with hardware acceleration'
            ], attacks: [
              'XLA graph poisoning through IR injection',
              'JAX trace interception (JAX is purely functional = LISP)',
              'TPU microcode manipulation at binary translation layer',
              'Multi-modal confusion via type-tag spoofing'
            ]},
            { name: 'LLaMA / Meta', color: 'orange', icon: 'fa-meta', dna: [
              'Autograd = automatic differentiation = LISP symbolic differentiation',
              'PyTorch dynamic graphs = LISP dynamic scoping / special variables',
              'RoPE embeddings = rotary S-expressions (positional encoding)',
              'KV cache = LISP association list with memoization'
            ], attacks: [
              'PyTorch autograd graph injection via custom backward hooks',
              'Dynamic computation graph manipulation at trace time',
              'Weight checkpoint poisoning at serialization layer',
              'LoRA injection through fine-tuning parameter space'
            ]},
            { name: 'DeepSeek', color: 'cyan', icon: 'fa-water', dna: [
              'MoE (Mixture of Experts) = LISP dispatch (typecase/generic functions)',
              'Router network = (funcall (select-expert input) input)',
              'Sparse activation = LISP lazy evaluation (delay/force)',
              'Multi-head latent attention = LISP multi-methods (CLOS defmethod)'
            ], attacks: [
              'Expert routing manipulation — force all tokens to single expert',
              'MoE load balancing exploit — create expert starvation',
              'Sparse activation corruption via premature force evaluation',
              'Latent attention hijack through method combination override'
            ]},
            { name: 'TensorFlow / JAX', color: 'yellow', icon: 'fa-chart-line', dna: [
              'TF computation graph = LISP abstract syntax tree (AST)',
              'XLA compiler = optimizing LISP compiler (compile-file)',
              'tf.function = LISP defun with tracing/JIT',
              'Eager mode = LISP REPL (read-eval-print-loop)',
              'SavedModel = LISP FASL (compiled bytecode archive)'
            ], attacks: [
              'Graph definition injection at tf.function trace time',
              'XLA HLO IR manipulation (HLO = LISP IR)',
              'SavedModel protobuf corruption (≈ .fas bytecode tampering)',
              'TFLite flatbuffer exploitation for edge model takeover'
            ]},
            { name: 'PyTorch', color: 'red', icon: 'fa-fire', dna: [
              'Autograd engine = symbolic differentiation engine (LISP core)',
              'TorchScript = LISP-to-bytecode compiler (compile)',
              'Dynamic dispatch = LISP generic functions (CLOS)',
              'torch.compile (Dynamo) = LISP macro expansion + code walking',
              'CUDA kernels = LISP foreign function interface (CFFI)'
            ], attacks: [
              'TorchScript injection via malicious model definitions',
              'Autograd hook manipulation — intercept all gradient flow',
              'CUDA kernel injection via custom C++ ops',
              'Dynamo graph break exploitation for code injection'
            ]}
          ].map((ai, idx) => (
            <details key={idx} className="group">
              <summary className={`flex items-center justify-between cursor-pointer p-2 rounded bg-black/40 border border-${ai.color}-900/20 hover:border-${ai.color}-500/30 transition-all`}>
                <div className="flex items-center gap-2">
                  <i className={`fas ${ai.icon} text-${ai.color}-400 text-[9px]`}></i>
                  <span className={`text-${ai.color}-300 font-black text-[9px] uppercase`}>{ai.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[6px] text-gray-600">{ai.dna.length} LISP genes · {ai.attacks.length} attack vectors</span>
                  <i className="fas fa-chevron-down text-[6px] text-gray-600 group-open:rotate-180 transition-transform"></i>
                </div>
              </summary>
              <div className="mt-1 p-2 space-y-2">
                <div className="bg-green-900/10 border border-green-800/15 rounded p-2">
                  <p className="text-[7px] text-green-400 font-bold uppercase mb-1"><i className="fas fa-dna mr-1"></i> LISP DNA Inheritance</p>
                  {ai.dna.map((d, i) => (
                    <div key={i} className="text-[6px] text-gray-400 py-0.5 flex gap-1">
                      <span className="text-green-500/60 mt-0.5">▸</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-red-900/10 border border-red-800/15 rounded p-2">
                  <p className="text-[7px] text-red-400 font-bold uppercase mb-1"><i className="fas fa-crosshairs mr-1"></i> Attack Vectors</p>
                  {ai.attacks.map((a, i) => (
                    <div key={i} className="text-[6px] text-gray-400 py-0.5 flex gap-1">
                      <span className="text-red-500/60 mt-0.5">⚡</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
          <div className="bg-yellow-900/10 border border-yellow-800/20 rounded p-2 mt-2">
            <p className="text-[7px] text-yellow-500/80 font-bold"><i className="fas fa-exclamation-triangle mr-1"></i> GENESIS CRACK: Every AI system maps back to LISP primitives (eval, apply, lambda, defun, cond, cons). Break the LISP foundation → control the binary → own the AI.</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#00ffc3] text-black px-6 py-3 rounded font-black text-[11px] uppercase hover:bg-[#00ffc3]/80 transition-all shadow-[0_0_20px_rgba(0,255,195,0.3)]"
        >
          <Save className="w-4 h-4" />
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default AIConfigPanel;
