import { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../../services/geminiService';
import { scanS3Buckets } from '../../services/realScanService';

interface FoundFile {
  name: string;
  size: string;
  content: string;
  bucket: string;
}

export default function S3BucketsTool() {
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [logs, setLogs] = useState<string[]>(['S3_BUCKET_SCANNER_V1.0 initialized.', 'All scans perform REAL HTTP requests to S3 endpoints.', 'Waiting for target domain or keyword...']);
  const [foundFiles, setFoundFiles] = useState<FoundFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const downloadFile = (file: FoundFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog(`[+] Downloaded: ${file.name}`);
  };

  const startScan = async () => {
    if (!target) {
      alert('Please enter a target domain or keyword.');
      return;
    }

    setIsScanning(true);
    setFoundFiles([]);
    const keyword = target.replace(/^https?:\/\//, '').replace(/\..*$/, '').replace(/[^a-zA-Z0-9-]/g, '');
    addLog(`[!] INITIATING REAL S3 BUCKET SCAN for keyword: ${keyword}`);
    addLog(`[*] Generating 22 permutations and sending real HTTP requests...`);

    const results = await scanS3Buckets(keyword, (bucket, status) => {
      addLog(`[!] BUCKET FOUND: ${bucket}.s3.amazonaws.com — ${status}`);
    });

    const publicBuckets = results.filter(r => r.status === 'public');
    const privateBuckets = results.filter(r => r.status === 'private');
    const notFound = results.filter(r => r.status === 'not_found');

    results.forEach(r => {
      if (r.status === 'public') {
        addLog(`[+] ${r.bucket} — PUBLIC (${r.objects.length} objects listed)`);
        r.objects.slice(0, 10).forEach(obj => addLog(`    -> ${obj}`));
        if (r.objects.length > 10) addLog(`    ... +${r.objects.length - 10} more objects`);
      } else if (r.status === 'private') {
        addLog(`[*] ${r.bucket} — EXISTS but Access Denied (403)`);
      } else if (r.status === 'not_found') {
        addLog(`[-] ${r.bucket} — not found (404)`);
      } else {
        addLog(`[-] ${r.bucket} — error: ${r.error || 'unknown'}`);
      }
    });

    // Create downloadable reports for public buckets
    publicBuckets.forEach(b => {
      if (b.objects.length > 0) {
        setFoundFiles(prev => [...prev, {
          name: `${b.bucket}_listing.txt`,
          size: `${b.objects.length} objects`,
          bucket: b.bucket,
          content: `Bucket: ${b.url}\nStatus: PUBLIC\nObjects:\n${b.objects.join('\n')}`,
        }]);
      }
    });

    // Full scan report
    setFoundFiles(prev => [...prev, {
      name: 's3_scan_report.json',
      size: `${JSON.stringify(results, null, 2).length} bytes`,
      bucket: keyword,
      content: JSON.stringify(results, null, 2),
    }]);

    addLog(`[!] S3 SCAN COMPLETE. ${publicBuckets.length} public, ${privateBuckets.length} private, ${notFound.length} not found.`);
    setIsScanning(false);
  };

  const startAiAssist = async () => {
    if (!target) {
      alert('Please enter a target domain for the AI to analyze.');
      return;
    }

    setIsAiAssisting(true);
    setIsScanning(true);
    setFoundFiles([]);
    const keyword = target.replace(/^https?:\/\//, '').replace(/\..*$/, '').replace(/[^a-zA-Z0-9-]/g, '');
    addLog(`[AI] Neural Core taking control of S3 Reaper...`);
    addLog(`[AI] Running real S3 scan on ${keyword} before AI analysis...`);

    const results = await scanS3Buckets(keyword, (bucket, status) => {
      addLog(`[+] FOUND: ${bucket} — ${status}`);
    });

    const publicBuckets = results.filter(r => r.status === 'public');
    const privateBuckets = results.filter(r => r.status === 'private');
    addLog(`[+] Scan complete: ${publicBuckets.length} public, ${privateBuckets.length} private`);

    addLog(`[AI] Feeding real S3 scan data to Quantum Intelligence...`);
    try {
      const realData = JSON.stringify({
        keyword,
        totalScanned: results.length,
        publicBuckets: publicBuckets.map(b => ({ bucket: b.bucket, objects: b.objects.length, files: b.objects.slice(0, 20) })),
        privateBuckets: privateBuckets.map(b => b.bucket),
      });

      const prompt = `You are a cloud security expert analyzing REAL S3 bucket scan results for keyword "${keyword}". Here is the actual data:\n\n${realData}\n\nAnalyze: which buckets are exposed, what sensitive data might be in listed objects, exploitation paths (IAM misconfig, public access, data exfiltration), and remediation. Reference the actual scan data. Format as a professional cloud security assessment.`;
      
      const response = await queryAgent("ORCHESTRATOR", prompt, "Context: Real S3 bucket scan analysis");
      response.split('\n').filter((l: string) => l.trim()).forEach((line: string) => addLog(`[AI] ${line}`));

      setFoundFiles(prev => [...prev, {
        name: 'ai_cloud_report.txt',
        size: `${response.length} bytes`,
        bucket: `ai-${keyword}`,
        content: `Target: ${keyword}\nAI Cloud Security Report:\n\n${response}`,
      }, {
        name: 'raw_s3_data.json',
        size: `${realData.length} bytes`,
        bucket: keyword,
        content: realData,
      }]);

      addLog(`[AI] Real-data cloud analysis complete.`);
    } catch (error) {
      addLog(`[!] AI Core failed. Raw scan data still available.`);
    }

    setIsAiAssisting(false);
    setIsScanning(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#f59e0b] font-mono p-4">
      <div className="border-b border-[#f59e0b]/30 pb-4 mb-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase drop-shadow-[0_0_8px_#f59e0b]">S3 BUCKET REAPER</h1>
          <p className="text-xs text-[#f59e0b]/60 uppercase tracking-[0.3em]">AWS / GCP / Azure Storage Enumeration</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold text-[#f59e0b]/80">Status: {isScanning ? (isAiAssisting ? 'AI-AUTOPILOT' : 'SCANNING') : 'IDLE'}</div>
          <div className="text-[10px] text-[#f59e0b]/50">Threads: 50 | Timeout: 5s</div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter target domain (e.g., example.com) or keyword..."
          className="flex-1 bg-black border border-[#f59e0b]/50 rounded p-3 text-[#f59e0b] outline-none focus:border-[#f59e0b] focus:shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all"
          disabled={isScanning}
          onKeyDown={e => e.key === 'Enter' && !isScanning && startScan()}
        />
        <button
          onClick={startScan}
          disabled={isScanning}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isScanning 
              ? 'bg-[#f59e0b]/20 text-[#f59e0b]/50 cursor-not-allowed border border-[#f59e0b]/20' 
              : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b] hover:bg-[#f59e0b] hover:text-black hover:shadow-[0_0_15px_#f59e0b]'
          }`}
        >
          <i className="fas fa-search mr-2"></i> Start Scan
        </button>
        <button
          onClick={startAiAssist}
          disabled={isScanning}
          className={`px-6 py-3 rounded font-black uppercase tracking-widest transition-all ${
            isScanning 
              ? 'bg-[#00ffc3]/20 text-[#00ffc3]/50 cursor-not-allowed border border-[#00ffc3]/20' 
              : 'bg-[#00ffc3]/10 text-[#00ffc3] border border-[#00ffc3] hover:bg-[#00ffc3] hover:text-black hover:shadow-[0_0_15px_#00ffc3]'
          }`}
        >
          <i className="fas fa-brain mr-2"></i> AI Auto-Pilot
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-black border border-[#f59e0b]/30 rounded-lg p-4 overflow-y-auto custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
          <div className="space-y-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className={`${log.includes('[!]') ? 'text-red-500 font-bold' : log.includes('[+]') ? 'text-emerald-500' : log.includes('CRITICAL') ? 'text-red-500 bg-red-500/10 inline-block px-1' : 'text-[#f59e0b]/80'}`}>
                {log}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {foundFiles.length > 0 && (
          <div className="w-full lg:w-1/3 bg-[#0a0a0a] border border-[#f59e0b]/50 rounded-lg p-4 flex flex-col shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <h3 className="text-lg font-black uppercase tracking-widest mb-4 border-b border-[#f59e0b]/30 pb-2">Extracted Loot</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {foundFiles.map((file, idx) => (
                <div key={idx} className="bg-black border border-[#f59e0b]/20 p-3 rounded flex flex-col gap-2 hover:border-[#f59e0b]/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{file.name}</span>
                      <span className="text-[10px] text-[#f59e0b]/60">Bucket: {file.bucket}</span>
                      <span className="text-[10px] text-[#f59e0b]/60">Size: {file.size}</span>
                    </div>
                    <button 
                      onClick={() => downloadFile(file)}
                      className="bg-[#f59e0b]/20 hover:bg-[#f59e0b] hover:text-black text-[#f59e0b] w-8 h-8 rounded flex items-center justify-center transition-all"
                      title="Download File"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
