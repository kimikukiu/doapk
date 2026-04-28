import React, { useState, useRef } from 'react';
import { whoamisecGptChat } from '../../services/geminiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPlay, faDownload, faCopy, faTerminal, faPlus } from '@fortawesome/free-solid-svg-icons';

const IdeTool: React.FC = () => {
  const [code, setCode] = useState('// Quantum Intelligence Ultra IDE v1.0\n// Neural link active...\n\nfunction main() {\n  console.log("Hello, Quantum World!");\n}\n\nmain();');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Quantum Intelligence Ultra IDE initialized.', '[SYSTEM] Ready for neural code synthesis.']);
  const terminalRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 10);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    addLog(`Initiating neural synthesis for: ${prompt.substring(0, 30)}...`);
    
    try {
      const response = await whoamisecGptChat(
        `GENERATE CODE. Follow Manus GPT AI style: think step-by-step, explain briefly, then provide the full code block.
        
        TASK: ${prompt}`,
        `Current Code:\n${code}`,
        'CODER'
      );

      // Extract code block
      const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        setCode(codeMatch[1].trim());
        addLog('Neural synthesis successful. Code updated.');
      } else {
        addLog('Synthesis complete, but no clear code block was detected. Reviewing response...');
      }
      
      // Add a snippet of the explanation to logs
      const explanation = response.split('```')[0].trim();
      if (explanation) {
        addLog(`AI: ${explanation.substring(0, 100)}...`);
      }

    } catch (error) {
      addLog(`ERROR: Neural link failure. [${error}]`);
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    addLog('Code copied to clipboard.');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum_code_${Date.now()}.js`;
    a.click();
    addLog('Source code exported.');
  };

  const handleNew = () => {
    setCode('// New Quantum Script\n\n');
    setLogs(['[SYSTEM] Buffer cleared.']);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-mono overflow-hidden border border-white/10 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="bg-black border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center border border-emerald-500/30">
            <FontAwesomeIcon icon={faCode} className="text-emerald-500 text-sm" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest">Quantum Intelligence Ultra IDE</h1>
            <p className="text-[8px] text-gray-500 uppercase">Neural Synthesis Engine v8.5</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleNew} className="text-[9px] font-black text-gray-500 hover:text-white uppercase px-2 py-1 transition-all">
            <FontAwesomeIcon icon={faPlus} className="mr-1" /> New
          </button>
          <button onClick={handleCopy} className="text-[9px] font-black text-gray-500 hover:text-white uppercase px-2 py-1 transition-all">
            <FontAwesomeIcon icon={faCopy} className="mr-1" /> Copy
          </button>
          <button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-black text-[9px] font-black uppercase px-3 py-1 rounded transition-all">
            <FontAwesomeIcon icon={faDownload} className="mr-1" /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Editor Area */}
        <div className="flex-1 relative group">
          <div className="absolute top-2 left-2 text-[8px] text-gray-700 uppercase font-black pointer-events-none z-10">
            source_editor.js
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-transparent p-6 pt-10 text-[11px] text-emerald-400 outline-none resize-none custom-scrollbar leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Terminal Area */}
        <div className="h-32 bg-black border-t border-white/10 flex flex-col">
          <div className="bg-white/5 px-4 py-1 flex items-center justify-between border-b border-white/5">
            <span className="text-[9px] text-gray-500 font-black uppercase flex items-center">
              <FontAwesomeIcon icon={faTerminal} className="mr-2" /> Terminal
            </span>
            <button onClick={() => setLogs([])} className="text-[8px] text-gray-600 hover:text-white uppercase">Clear</button>
          </div>
          <div ref={terminalRef} className="flex-1 overflow-y-auto p-3 text-[10px] space-y-1 custom-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className="flex space-x-2">
                <span className="text-emerald-600">➜</span>
                <span className={log.includes('ERROR') ? 'text-red-500' : 'text-gray-400'}>{log}</span>
              </div>
            ))}
            {loading && <div className="text-emerald-500 animate-pulse">_</div>}
          </div>
        </div>
      </div>

      {/* Prompt Area */}
      <div className="p-4 bg-black border-t border-white/10">
        <div className="flex gap-2 bg-white/5 p-2 rounded-lg border border-white/10 focus-within:border-emerald-500/50 transition-all">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe the code you want to generate (e.g., 'Write a port scanner in Node.js')..."
            className="flex-1 bg-transparent text-white px-4 py-2 text-xs outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-black px-6 py-2 rounded-md font-black text-[10px] uppercase transition-all disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <FontAwesomeIcon icon={faPlay} className="mr-2" />
            )}
            {loading ? 'Synthesizing...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdeTool;
