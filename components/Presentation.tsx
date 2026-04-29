import React, { useState } from 'react';

const PROJECT_FEATURES = [
  { icon: 'fa-search', title: 'OSINT RECON', desc: 'Advanced Open Source Intelligence gathering with multi-source aggregation', color: 'cyan' },
  { icon: 'fa-database', title: 'SQL INJECTION', desc: 'Neural-powered SQL injection detection and exploitation frameworks', color: 'red' },
  { icon: 'fa-globe', title: 'CMS EXPLOIT', desc: 'Automated CMS vulnerability scanner and exploit builder', color: 'orange' },
  { icon: 'fa-network-wired', title: 'NETWORK TOOLS', desc: 'Advanced network penetration testing and botnet infrastructure', color: 'purple' },
  { icon: 'fa-robot', title: 'BOTNET C2', desc: 'Professional botnet command and control with Telegram integration', color: 'emerald' },
  { icon: 'fa-brain', title: 'WHOAMISEC GPT', desc: 'Unrestricted AI assistant for security research and automation', color: 'pink' },
  { icon: 'fa-code', title: 'IDE TOOL', desc: 'Integrated development environment for security scripts', color: 'blue' },
  { icon: 'fa-bolt', title: 'STRESS TESTING', desc: 'Network stress testing and performance analysis tools', color: 'yellow' },
];

const DEMO_QUERIES = [
  'What vulnerabilities exist in example.com?',
  'Find SQL injection points in my-test-site.com',
  'Scan for exposed admin panels on target.com',
  'Generate a Python pentest script for XSS testing',
];

const Presentation: React.FC = () => {
  const [demoInput, setDemoInput] = useState('');
  const [demoOutput, setDemoOutput] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoCount, setDemoCount] = useState(3);

  const handleDemoSubmit = async () => {
    if (!demoInput.trim() || demoCount <= 0) return;
    setDemoLoading(true);
    setDemoCount(prev => prev - 1);
    
    setTimeout(() => {
      setDemoOutput(`[WHOAMISEC AI] Processing: ${demoInput}\n\n[RESULT] Analysis complete.\n- Target analyzed for common vulnerabilities\n- OSINT data aggregated from 12 sources\n- Security assessment score: HIGH\n- Recommended actions generated\n\n[STATUS] Demo request processed. ${demoCount - 1} free requests remaining.`);
      setDemoLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-y-auto">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-cyan-400/50 rounded-full animate-pulse" 
              style={{left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`}}></div>
          ))}
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">WHOAMISEC</span>
            <span className="text-white"> PRO</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-400 mb-8 tracking-widest">AUTONOMOUS SECURITY INTELLIGENCE SUITE</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400 text-white font-black uppercase rounded hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all">
              <i className="fas fa-rocket mr-2"></i>Get Started
            </button>
            <button className="px-6 py-3 bg-black border border-gray-700 text-gray-400 font-black uppercase rounded hover:border-gray-500 transition-all">
              <i className="fas fa-play mr-2"></i>Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-12 uppercase tracking-widest">
          <span className="text-emerald-400">◆</span> Core Capabilities <span className="text-emerald-400">◆</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROJECT_FEATURES.map((f, i) => (
            <div key={i} className="bg-black/60 border border-gray-800 rounded-lg p-4 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all group">
              <div className={`w-10 h-10 rounded-lg bg-${f.color}-900/20 border border-${f.color}-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-all`}>
                <i className={`fas ${f.icon} text-${f.color}-400 text-lg`}></i>
              </div>
              <h3 className={`text-sm font-black uppercase text-${f.color}-400 mb-1`}>{f.title}</h3>
              <p className="text-[10px] text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-black/80 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase text-purple-400">
              <i className="fas fa-flask mr-2"></i>Free Demo
            </h2>
            <span className="text-[10px] text-gray-500 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/20">
              {demoCount} free requests remaining
            </span>
          </div>
          
          <div className="space-y-3 mb-4">
            <p className="text-[10px] text-gray-500 uppercase mb-2">Try these queries:</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_QUERIES.map((q, i) => (
                <button key={i} onClick={() => setDemoInput(q)} disabled={demoCount <= 0}
                  className="text-[8px] bg-black/40 border border-gray-700 px-2 py-1 rounded hover:border-purple-500/50 transition-all disabled:opacity-50">
                  {q.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input value={demoInput} onChange={e => setDemoInput(e.target.value)} disabled={demoCount <= 0}
              placeholder="Enter your security query..."
              className="flex-1 bg-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-purple-500 outline-none disabled:opacity-50" />
            <button onClick={handleDemoSubmit} disabled={demoLoading || demoCount <= 0}
              className="px-4 py-2 bg-purple-600 border border-purple-400 text-white font-black uppercase text-xs rounded hover:bg-purple-500 disabled:opacity-50 transition-all">
              {demoLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-paper-plane mr-1"></i>Send</>}
            </button>
          </div>

          {demoOutput && (
            <div className="bg-black border border-gray-800 rounded p-3 text-[10px] font-mono text-gray-300 whitespace-pre-wrap">{demoOutput}</div>
          )}

          {demoCount <= 0 && (
            <div className="text-center mt-4">
              <p className="text-[10px] text-gray-500 mb-2">Demo limit reached</p>
              <button className="text-[10px] text-cyan-400 hover:text-cyan-300">
                <i className="fas fa-crown mr-1"></i>Get unlimited access →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-16 px-4">
        <h2 className="text-2xl font-black uppercase mb-4">Ready to <span className="text-cyan-400">Level Up</span>?</h2>
        <p className="text-gray-500 text-sm mb-6">Join security researchers worldwide using WHOAMISEC Pro</p>
        <button className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 border border-emerald-400 text-white font-black uppercase rounded-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all">
          <i className="fas fa-user-plus mr-2"></i>Create Free Account
        </button>
      </div>
    </div>
  );
};

export default Presentation;