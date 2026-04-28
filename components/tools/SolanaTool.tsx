import React from 'react';

const SolanaTool: React.FC = () => {
  return (
    <div className="p-8 bg-[#0e1313] text-[#aa00ff] h-full">
      <h1 className="text-2xl font-bold mb-4 uppercase tracking-widest">Solana Chain Explorer</h1>
      <p className="opacity-70 italic">Monitoring on-chain liquidity and whale movements.</p>
      <div className="mt-8 p-4 border border-[#aa00ff]/20 bg-black/40 rounded font-mono text-sm">
        <p>&gt; Scanning blocks...</p>
      </div>
    </div>
  );
};

export default SolanaTool;
