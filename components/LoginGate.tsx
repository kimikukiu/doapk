import React, { useState, useEffect } from 'react';

const ADMIN_PASSWORD = '#@MerleoskyBleashtokinbainauziashanski7#';
const AUTH_KEY = 'whoamisec_auth_session';

interface LoginGateProps {
  children: React.ReactNode;
}

const LoginGate: React.FC<LoginGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(AUTH_KEY);
    if (session === btoa(ADMIN_PASSWORD)) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, btoa(ADMIN_PASSWORD));
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('ACCESS DENIED — Invalid credentials');
      setPassword('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 animate-pulse text-sm font-mono">INITIALIZING QUANTUM CORE...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative">
        <button onClick={handleLogout}
          className="fixed top-2 right-2 z-[9999] px-2 py-1 bg-black/80 border border-red-900/30 text-gray-600 text-[6px] font-mono rounded hover:text-red-400 hover:border-red-500/50 transition-all"
          title="Logout">
          <i className="fas fa-sign-out-alt mr-1"></i>LOGOUT
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Animated scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-[2px] bg-red-500/20 animate-pulse" style={{ top: '30%' }}></div>
        <div className="absolute w-full h-[1px] bg-red-500/10 animate-pulse" style={{ top: '60%', animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-500/10 rounded-2xl border border-red-900/30 mb-4">
            <i className="fas fa-skull-crossbones text-red-500 text-4xl"></i>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
            WHOAMI<span className="text-red-500">SEC</span> PRO
          </h1>
          <p className="text-[8px] text-gray-600 uppercase tracking-[0.3em] mt-1">
            Quantum Intelligence · Autonomous Swarm · C2 Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-[#050505] border border-red-900/30 rounded-xl p-6 space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Admin Authentication Required</h2>
            <p className="text-[7px] text-gray-600 mt-1">Enter master password to access the platform</p>
          </div>

          <div>
            <label className="text-[8px] text-red-400 font-black uppercase block mb-1.5">
              <i className="fas fa-lock mr-1"></i>Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter admin password..."
              autoFocus
              className="w-full bg-black border border-red-900/30 rounded-lg px-4 py-3 text-sm text-white font-mono outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder-gray-700"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-red-500 text-[10px]"></i>
              <span className="text-[8px] text-red-400 font-bold uppercase">{error}</span>
            </div>
          )}

          <button type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 border border-red-500">
            <i className="fas fa-shield-halved"></i>
            AUTHENTICATE
          </button>

          <div className="text-center pt-2">
            <p className="text-[6px] text-gray-700 font-mono">
              WHOAMISEC PRO v2.0 · Quantum Intelligence · {new Date().getFullYear()}
            </p>
          </div>
        </form>

        {/* Bottom decoration */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[6px] text-gray-800">
          <span><i className="fas fa-satellite-dish mr-1"></i>C2 READY</span>
          <span>·</span>
          <span><i className="fas fa-brain mr-1"></i>QUANTUM AI</span>
          <span>·</span>
          <span><i className="fas fa-shield-halved mr-1"></i>ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
};

export { LoginGate, AUTH_KEY };
export default LoginGate;
