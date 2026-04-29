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
    
    // Get API key from localStorage (from app config)
    const apiKey = localStorage.getItem('openrouter_api_key') || '';
    
    try {
      const response = await fetch('/api/local-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: demoInput, 
          model: 'gpt-4o-mini',
          apiKey: apiKey || undefined
        })
      });
      const data = await response.json();
      setDemoOutput(`[WHOAMISEC AI] ${data.text}\n\n[STATUS] ${demoCount - 1} free requests remaining.`);
    } catch (err) {
      setDemoOutput(`[WHOAMISEC AI] Processing: ${demoInput}\n\n[RESULT] AI response ready.\n- Using local quantum core\n- Enter your API key in the app to enable full AI\n\n[STATUS] ${demoCount - 1} free requests remaining.`);
    }
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono overflow-y-auto">
      {/* Animated Cyberpunk Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black/90 to-black/70"></div>
        {/* Floating Neural Membranes */}
        <div className="absolute top-20 left-20 w-40 h-40 border border-cyan-500/20 rounded-full animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute top-40 right-32 w-32 h-32 border border-purple-500/20 rounded-full animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 border border-pink-500/20 rounded-full animate-pulse" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 right-20 w-20 h-20 border border-emerald-500/20 rounded-full animate-pulse" style={{animationDuration: '4.5s', animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 border border-orange-500/20 rounded-full animate-pulse" style={{animationDuration: '3s', animationDelay: '1.5s'}}></div>
        {/* Scanning Lines */}
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-pulse" style={{top: '15%', animationDuration: '3s'}}></div>
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent animate-pulse" style={{top: '35%', animationDuration: '4s', animationDelay: '1s'}}></div>
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500/40 to-transparent animate-pulse" style={{top: '55%', animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent animate-pulse" style={{top: '75%', animationDuration: '3.5s', animationDelay: '2s'}}></div>
        {/* Neural Network Dots */}
        {[...Array(40)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse" 
            style={{left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%`, animationDelay: `${Math.random() * 3}s`}}></div>
        ))}
        {/* Data Streams */}
        <div className="absolute top-0 right-10 w-1 h-64 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent animate-pulse" style={{animationDuration: '2s'}}></div>
        <div className="absolute top-32 left-5 w-0.5 h-48 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent animate-pulse" style={{animationDuration: '3s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-20 w-0.5 h-32 bg-gradient-to-b from-transparent via-pink-500/20 to-transparent animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-0.5 h-40 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent animate-pulse" style={{animationDuration: '3.5s', animationDelay: '1.5s'}}></div>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,195,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,195,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden pt-20">
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

      {/* How to Buy Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-8 uppercase tracking-widest">
          <span className="text-yellow-400">◆</span> How to Purchase <span className="text-yellow-400">◆</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">1</span>
            </div>
            <h3 className="text-sm font-black text-yellow-400 uppercase mb-2">Choose Plan</h3>
            <p className="text-[10px] text-gray-500">Select FREE DEMO, BASIC, VIP or PREMIUM from the app</p>
          </div>
          <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">2</span>
            </div>
            <h3 className="text-sm font-black text-yellow-400 uppercase mb-2">Send Payment</h3>
            <p className="text-[10px] text-gray-500">Send XMR to wallet in app or contact @admin for other methods</p>
          </div>
          <div className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">3</span>
            </div>
            <h3 className="text-sm font-black text-yellow-400 uppercase mb-2">Get Access</h3>
            <p className="text-[10px] text-gray-500">Receive token instantly. Activate in app and enjoy unlimited AI</p>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-center">
          <p className="text-[10px] text-yellow-400 mb-2">Questions? Contact @admin on Telegram</p>
          <p className="text-[8px] text-gray-500">Payment via Monero (XMR) - most private cryptocurrency</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-16 px-4">
        <h2 className="text-2xl font-black uppercase mb-4">Ready to <span className="text-cyan-400">Level Up</span>?</h2>
        <p className="text-gray-500 text-sm mb-6">Join security researchers worldwide using WHOAMISEC Pro</p>
        <a href="/app" className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 border border-emerald-400 text-white font-black uppercase rounded-lg hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all">
          <i className="fas fa-rocket mr-2"></i>Open WHOAMISEC PRO
        </a>
      </div>
    </div>
  );
};

export default Presentation;