import React, { useState } from 'react';
import { lispRepl } from '../../src/services/lispApi';

const LispNeuralPanel: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [nnName, setNnName] = useState('my-net');
  const [nnLayers, setNnLayers] = useState('2,4,1');
  const [nnLr, setNnLr] = useState('0.5');
  const [predictInput, setPredictInput] = useState('');
  const [kmeansData, setKmeansData] = useState('');
  const [kmeansK, setKmeansK] = useState('3');

  const run = (code: string, label: string) => {
    const r = lispRepl(code);
    setOutput(prev => [...prev, `[${label}] ${code}`, r.output]);
  };

  return (
    <div className="space-y-4 animate-in">
      <div className="bg-[#050505] border border-purple-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
            <i className="fas fa-brain text-purple-400 text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">LISP <span className="text-purple-400">Neural Network / ML</span></h2>
            <p className="text-[7px] text-gray-600 uppercase tracking-widest">Neural Nets · K-Means · Naive Bayes · Decision Tree · KNN · PCA · Linear Regression · Perceptron</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Neural Network */}
        <div className="bg-black border border-purple-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-purple-400 uppercase mb-2"><i className="fas fa-network-wired mr-1"></i> Neural Network</h3>
          <div className="space-y-1 mb-2">
            <input value={nnName} onChange={e => setNnName(e.target.value)} placeholder="Network name..."
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-purple-300 font-mono outline-none" />
            <div className="flex gap-1">
              <input value={nnLayers} onChange={e => setNnLayers(e.target.value)} placeholder="Layers: 2,4,1"
                className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-purple-300 font-mono outline-none" />
              <input value={nnLr} onChange={e => setNnLr(e.target.value)} placeholder="LR: 0.5"
                className="w-20 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-purple-300 font-mono outline-none" />
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => run(`(nn/create "${nnName}" "${nnLayers}" ${nnLr})`, 'NN')} className="px-2 py-1 bg-purple-600 text-black font-black text-[7px] uppercase rounded">Create</button>
            <button onClick={() => run('(train-xor-network)', 'NN-XOR')} className="px-2 py-1 bg-purple-700 text-white font-black text-[7px] uppercase rounded">Train XOR Demo</button>
          </div>
          <div className="flex gap-1 mt-2">
            <input value={predictInput} onChange={e => setPredictInput(e.target.value)} placeholder="Input: 1,0"
              className="flex-1 bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-purple-300 font-mono outline-none" />
            <button onClick={() => run(`(nn/predict "${nnName}" "${predictInput}")`, 'PREDICT')} className="px-2 py-1 bg-purple-600 text-black font-black text-[7px] uppercase rounded">Predict</button>
          </div>
        </div>

        {/* K-Means */}
        <div className="bg-black border border-purple-900/20 rounded-lg p-3">
          <h3 className="text-[9px] font-black text-purple-400 uppercase mb-2"><i className="fas fa-circle-nodes mr-1"></i> K-Means Clustering</h3>
          <div className="space-y-1 mb-2">
            <textarea value={kmeansData} onChange={e => setKmeansData(e.target.value)}
              placeholder='[{"x":1,"y":2},{"x":3,"y":4},{"x":10,"y":11}]'
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-purple-300 font-mono outline-none h-14 resize-none" />
            <input value={kmeansK} onChange={e => setKmeansK(e.target.value)} placeholder="K clusters..."
              className="w-full bg-black border border-white/10 rounded px-2 py-1.5 text-[9px] text-purple-300 font-mono outline-none" />
          </div>
          <button onClick={() => run(`(ml/kmeans '${kmeansData}' ${kmeansK})`, 'KMEANS')} className="px-3 py-1 bg-purple-600 text-black font-black text-[7px] uppercase rounded">Cluster</button>
        </div>
      </div>

      {/* ML Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button onClick={() => run('(ml/linreg "1,2,3,4,5" "2,4,5,4,5")', 'LINREG')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">Linear Regression</span>
          <span className="text-[6px] text-gray-600">OLS with R-squared</span>
        </button>
        <button onClick={() => run('(ml/pca "[[1,2,3],[4,5,6],[7,8,9],[10,11,12]]" 2)', 'PCA')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">PCA</span>
          <span className="text-[6px] text-gray-600">Dimensionality reduction</span>
        </button>
        <button onClick={() => run('(ml/normalize "1,5,10,15,20")', 'NORM')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">Normalize</span>
          <span className="text-[6px] text-gray-600">Min-max normalization</span>
        </button>
        <button onClick={() => run('(ml/train-test-split "[[1,2],[3,4],[5,6],[7,8],[9,10]]" 0.8)', 'SPLIT')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">Train/Test Split</span>
          <span className="text-[6px] text-gray-600">80/20 data split</span>
        </button>
        <button onClick={() => run('(ml/bayes-create "classifier-1")', 'BAYES')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">Naive Bayes</span>
          <span className="text-[6px] text-gray-600">Create classifier</span>
        </button>
        <button onClick={() => run('(ml/perceptron-train "[[0,0],[0,1],[1,0],[1,1]]" "[0,0,0,1]" 0.1 100)', 'PERC')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">Perceptron</span>
          <span className="text-[6px] text-gray-600">Train AND gate</span>
        </button>
        <button onClick={() => run('(analyze-data "10,20,30,40,50,60,70,80,90,100")', 'STATS')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">Statistics</span>
          <span className="text-[6px] text-gray-600">Mean/Median/StdDev</span>
        </button>
        <button onClick={() => run('(ml/confusion-matrix "[1,0,1,1,0]" "[1,0,0,1,0]")', 'CONF')} className="p-2 bg-black border border-purple-900/20 rounded hover:border-purple-500/30 transition-all">
          <span className="text-[8px] font-black text-purple-400 uppercase block">Confusion Matrix</span>
          <span className="text-[6px] text-gray-600">Accuracy metrics</span>
        </button>
      </div>

      {/* Output */}
      <div className="bg-black border border-purple-900/20 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-purple-900/10 bg-purple-900/5 flex items-center justify-between">
          <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest"><i className="fas fa-terminal mr-1"></i> ML Output</span>
          <button onClick={() => setOutput([])} className="text-[7px] text-gray-600 hover:text-purple-400 transition-all">Clear</button>
        </div>
        <div className="p-3 h-48 overflow-y-auto custom-scroll font-mono text-[8px] space-y-1">
          {output.length === 0 && <p className="text-gray-700 italic">Run ML operations above...</p>}
          {output.map((line, i) => (
            <pre key={i} className={`whitespace-pre-wrap ${line.startsWith('[') ? 'text-purple-400' : line.includes('ERROR') ? 'text-red-400' : 'text-gray-400'}`}>{line}</pre>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LispNeuralPanel;
