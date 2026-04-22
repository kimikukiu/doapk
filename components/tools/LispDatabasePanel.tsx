import React, { useState } from 'react';
import { lispRepl } from '../../src/services/lispApi';

const LispDatabasePanel: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [sqlInput, setSqlInput] = useState('');
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState('');
  const [insertTable, setInsertTable] = useState('');
  const [insertCols, setInsertCols] = useState('');
  const [insertVals, setInsertVals] = useState('');

  const run = (code: string, label: string) => {
    const r = lispRepl(code);
    setOutput(prev => [...prev, `[${label}] ${code}`, r.output]);
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-blue-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
            <i className="fas fa-database text-blue-400 text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">LISP <span className="text-blue-400">SQL Database</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">In-Memory SQL Engine — CREATE · INSERT · SELECT · UPDATE · DELETE · JOIN · GROUP BY · Transactions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Raw SQL */}
        <div className="bg-black border border-blue-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-blue-400 uppercase mb-2"><i className="fas fa-terminal mr-1"></i> Raw SQL Query</h3>
          <textarea value={sqlInput} onChange={e => setSqlInput(e.target.value)} placeholder="SELECT * FROM users WHERE role = 'admin'"
            className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-blue-300 font-mono outline-none h-16 resize-none mb-2" />
          <button onClick={() => run(`(db/query "${sqlInput.replace(/"/g, '\\"')}")`, 'SQL')} className="px-3 py-1 bg-blue-600 text-black font-black text-[7px] uppercase rounded">Execute SQL</button>
        </div>

        {/* Create Table */}
        <div className="bg-black border border-blue-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-blue-400 uppercase mb-2"><i className="fas fa-table mr-1"></i> Create Table</h3>
          <input value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Table name..."
            className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-blue-300 font-mono outline-none mb-1" />
          <input value={columns} onChange={e => setColumns(e.target.value)} placeholder="id INTEGER PRIMARY KEY, name TEXT, age INTEGER"
            className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-blue-300 font-mono outline-none mb-2" />
          <button onClick={() => run(`(db/create-table "${tableName}" "${columns}")`, 'CREATE')} className="px-3 py-1 bg-blue-600 text-black font-black text-[7px] uppercase rounded">Create</button>
        </div>

        {/* Insert */}
        <div className="bg-black border border-blue-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-blue-400 uppercase mb-2"><i className="fas fa-plus mr-1"></i> Insert Row</h3>
          <input value={insertTable} onChange={e => setInsertTable(e.target.value)} placeholder="Table name..."
            className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-blue-300 font-mono outline-none mb-1" />
          <input value={insertCols} onChange={e => setInsertCols(e.target.value)} placeholder="name,age,role"
            className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-blue-300 font-mono outline-none mb-1" />
          <input value={insertVals} onChange={e => setInsertVals(e.target.value)} placeholder="'John',25,'admin'"
            className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-blue-300 font-mono outline-none mb-2" />
          <button onClick={() => run(`(db/insert "${insertTable}" "${insertCols}" "${insertVals}")`, 'INSERT')} className="px-3 py-1 bg-blue-600 text-black font-black text-[7px] uppercase rounded">Insert</button>
        </div>

        {/* Quick Actions */}
        <div className="bg-black border border-blue-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-blue-400 uppercase mb-2"><i className="fas fa-bolt mr-1"></i> Quick Actions</h3>
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => run('(setup-users-db)', 'SEED')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">Seed Users DB</button>
            <button onClick={() => run('(db/tables)', 'TABLES')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">List Tables</button>
            <button onClick={() => run('(db/select "users" "*")', 'SELECT')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">Select All Users</button>
            <button onClick={() => run('(db/count "users")', 'COUNT')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">Count Rows</button>
            <button onClick={() => run('(db/begin)', 'TXN')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">Begin Transaction</button>
            <button onClick={() => run('(db/commit)', 'TXN')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">Commit</button>
            <button onClick={() => run('(db/export "users")', 'EXPORT')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">Export JSON</button>
            <button onClick={() => run('(db/migrate-status)', 'MIGRATE')} className="p-1.5 bg-blue-900/20 rounded text-[7px] font-black text-blue-400 uppercase hover:bg-blue-900/30 transition-all">Migration Status</button>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="bg-black border border-blue-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-blue-900/10 bg-blue-900/5 flex items-center justify-between">
          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> SQL Output</span>
          <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-blue-400 transition-all">Clear</button>
        </div>
        <div className="p-3 h-48 overflow-y-auto custom-scroll font-mono text-[8px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Run SQL queries or use quick actions above...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('[') ? 'text-blue-400' : line.includes('ERROR') ? 'text-red-400' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LispDatabasePanel;
