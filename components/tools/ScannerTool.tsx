import React from 'react';

const ScannerTool: React.FC = () => {
  return (
    <div className="p-8 bg-[#0e1313] text-[#ff00ff] h-full">
      <h1 className="text-2xl font-bold mb-4 uppercase tracking-widest">Network Scanner</h1>
      <p className="opacity-70 italic">Deep-packet inspection and vulnerability mapping.</p>
      <div className="mt-8 p-4 border border-[#ff00ff]/20 bg-black/40 rounded font-mono text-sm">
        <p>&gt; Probing target surface...</p>
      </div>
    </div>
  );
};

export default ScannerTool;
