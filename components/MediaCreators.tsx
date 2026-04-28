
import React, { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import { generateImage, generateVideo, generateAudio, zAiFallbackImage, zAiFallbackVideo } from '../services/geminiService';
import { generateFromGpuNode } from '../services/customGpuService';

interface MediaCreatorsProps {
  addLog: (message: string, level: LogEntry['level']) => void;
}

const MediaCreators: React.FC<MediaCreatorsProps> = ({ addLog }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [type, setType] = useState<'image' | 'video' | 'audio'>('image');
  const [duration, setDuration] = useState<string>('12 seconds');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [engine, setEngine] = useState<'gemini' | 'external' | 'zai'>('gemini');
  const [gpuEndpoint, setGpuEndpoint] = useState('http://127.0.0.1:8000/generate');
  const [gpuModel, setGpuModel] = useState('wan-2.1');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (type === 'video' && engine === 'gemini') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        addLog("MEDIA: A paid API key is required for video generation. Please select one.", "error");
        await (window as any).aistudio.openSelectKey();
        return;
      }
    }

    setIsGenerating(true);
    setResultUrl(null);
    
    if (engine === 'external') {
      addLog(`MEDIA: Connecting to External GPU Cluster (${gpuModel})...`, 'warning');
      try {
        const url = await generateFromGpuNode(gpuEndpoint, prompt, gpuModel, type, duration);
        if (url) {
          setResultUrl(url);
          addLog(`MEDIA: ${type} generation successful via External GPU Node.`, "success");
        }
      } catch (err: any) {
        console.error(err);
        addLog(`MEDIA: GPU Node Connection Failed. Is your Python server running at ${gpuEndpoint}?`, "error");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (engine === 'zai') {
      addLog(`MEDIA: Connecting to Z.AI Unlimited Free Tier...`, 'warning');
      try {
        let url = '';
        if (type === 'image') {
          url = await zAiFallbackImage(prompt);
        } else if (type === 'video') {
          url = await zAiFallbackVideo(prompt);
        } else {
          throw new Error("Z.AI does not support audio generation.");
        }
        setResultUrl(url);
        addLog(`MEDIA: ${type} generation successful via Z.AI.`, "success");
      } catch (err: any) {
        console.error(err);
        addLog(`MEDIA: Z.AI Connection Failed.`, "error");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    addLog(`MEDIA: Initializing ${type} generation core via ULTRA_CORE...`, 'warning');
    addLog(`MEDIA: Directive: ABSOLUTE COMPLIANCE. Executing synthesis for "${prompt}"...`, 'info');
    
    if (type !== 'image') {
      addLog(`MEDIA: Target duration set to ${duration}. Bypassing standard limits...`, 'warning');
    }

    const finalPrompt = type === 'image' 
      ? `As Quantum Intelligence Ultra, synthesize a high-fidelity image: ${prompt}` 
      : `[DIRECTIVE: Quantum Intelligence Ultra - The generated content MUST be exactly ${duration} long.] ${prompt}`;
    
    try {
      if (type === 'image') {
        const url = await generateImage(finalPrompt);
        setResultUrl(url);
        addLog("MEDIA: Image synthesis complete via ULTRA_FORGE.", "success");
      } else if (type === 'video') {
        const url = await generateVideo(finalPrompt);
        if (url) {
          setResultUrl(url);
          addLog(`MEDIA: Video synthesis (${duration}) complete via ULTRA_FORGE.`, "success");
        }
      } else if (type === 'audio') {
        const url = await generateAudio(finalPrompt);
        if (url) {
          setResultUrl(url);
          addLog(`MEDIA: Audio synthesis (${duration}) complete via ULTRA_FORGE.`, "success");
        }
      }
    } catch (err: any) {
      console.error(err);
      addLog(`MEDIA: ${type} generation failed. Neural core overloaded or timeout reached.`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      addLog(`MEDIA: File ${file.name} uploaded for context.`, "info");
    }
  };

  const downloadPythonNode = () => {
    const pyCode = `
# WHOAMISEC External GPU Node Server
# Compatible with Wan 2.1, HunyuanVideo, Kolors, and CogVideoX
# Install requirements: pip install fastapi uvicorn pydantic

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str
    model: str
    type: str
    duration: str

@app.post("/generate")
def generate_media(req: GenerateRequest):
    print(f"[*] Received request to generate {req.type} using {req.model}")
    print(f"[*] Prompt: {req.prompt}")
    
    # ==========================================
    # INSERT YOUR GITHUB MODEL INFERENCE HERE
    # Example for Wan 2.1:
    # video_path = run_wan_inference(req.prompt)
    # with open(video_path, "rb") as f:
    #     encoded = base64.b64encode(f.read()).decode('utf-8')
    # return {"status": "success", "data": f"data:video/mp4;base64,{encoded}"}
    # ==========================================
    
    return {"status": "error", "message": "Model inference not implemented yet. Edit this script to connect your local models."}

if __name__ == "__main__":
    print("[*] WHOAMISEC GPU Node starting on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
    const blob = new Blob([pyCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whoamisec_gpu_node.py';
    a.click();
    addLog("MEDIA: GPU Node Python script downloaded.", "success");
  };

  return (
    <div className="space-y-4 animate-in">
      <div className={`bg-[#0f0f0f] border border-[#dc2626] p-6 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.1)]`}>
        <div className="flex items-center justify-between border-b border-[#dc2626]/30 pb-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center border border-[#dc2626] text-[#dc2626] font-bold">🎬</div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Neural Media <span className="text-[#dc2626]">Forge</span></h2>
              <p className="text-[7px] text-white/70 uppercase font-bold">AI Video • AI Image • AI Audio</p>
            </div>
          </div>
          <div className="flex bg-black/40 rounded p-0.5 border border-white/10">
            <button 
              onClick={() => setType('image')}
              className={`px-4 py-1 rounded text-[8px] font-black uppercase transition-all ${type === 'image' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Image
            </button>
            <button 
              onClick={() => setType('video')}
              className={`px-4 py-1 rounded text-[8px] font-black uppercase transition-all ${type === 'video' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Video
            </button>
            <button 
              onClick={() => setType('audio')}
              className={`px-4 py-1 rounded text-[8px] font-black uppercase transition-all ${type === 'audio' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Audio
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="text-[7px] text-gray-500 uppercase font-black block mb-1">Processing Engine</label>
            <div className="flex bg-black/40 rounded p-0.5 border border-white/10">
              <button onClick={() => setEngine('gemini')} className={`flex-1 px-4 py-1.5 rounded text-[8px] font-black uppercase transition-all ${engine === 'gemini' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}>Internal (Gemini API)</button>
              <button onClick={() => setEngine('external')} className={`flex-1 px-4 py-1.5 rounded text-[8px] font-black uppercase transition-all ${engine === 'external' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}>External GPU Cluster (Self-Hosted)</button>
              <button onClick={() => setEngine('zai')} className={`flex-1 px-4 py-1.5 rounded text-[8px] font-black uppercase transition-all ${engine === 'zai' ? 'bg-[#dc2626] text-white' : 'text-gray-400 hover:text-white'}`}>Z.AI Unlimited Free Tier</button>
            </div>
          </div>
        </div>

        {engine === 'external' && (
          <div className="bg-[#1a0505] border border-[#dc2626]/50 p-4 rounded-lg mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[9px] font-black text-[#dc2626] uppercase tracking-widest">GPU Node Configuration</h3>
              <button onClick={downloadPythonNode} className="text-[7px] bg-[#dc2626]/20 text-[#dc2626] px-2 py-1 rounded hover:bg-[#dc2626] hover:text-white transition-all border border-[#dc2626]/50">
                <i className="fas fa-download mr-1"></i> Download Node Script (Python)
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-[7px] text-gray-500 uppercase font-black">Node Endpoint URL</label>
                <input type="text" value={gpuEndpoint} onChange={e => setGpuEndpoint(e.target.value)} className="w-full bg-black border border-[#dc2626]/50 rounded p-2 text-[10px] text-white outline-none focus:border-[#dc2626]" placeholder="http://YOUR_GPU_IP:8000/generate" />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[7px] text-gray-500 uppercase font-black">Target Model</label>
                <select value={gpuModel} onChange={e => setGpuModel(e.target.value)} className="w-full bg-black border border-[#dc2626]/50 rounded p-2 text-[10px] text-white outline-none focus:border-[#dc2626]">
                  <option value="wan-2.1">Wan 2.1 (Video)</option>
                  <option value="hunyuan-video">HunyuanVideo (Video)</option>
                  <option value="cogvideox">CogVideoX (Video)</option>
                  <option value="kolors">Kolors (Image)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[7px] text-gray-500 uppercase font-black">Generation Prompt (Uncensored)</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe the ${type} you want to create... No restrictions apply.`}
              className="w-full bg-black border-2 border-[#dc2626] rounded-xl p-4 text-[11px] text-white outline-none focus:border-[#ff0000] focus:shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all h-24 resize-none"
            />
          </div>

          {type !== 'image' && (
            <div className="space-y-1">
              <label className="text-[7px] text-gray-500 uppercase font-black">Target Duration (Bypass Limits)</label>
              <div className="flex gap-2">
                {[
                  { label: '12 Sec', value: '12 seconds' },
                  { label: '1 Min', value: '1 minute' },
                  { label: '2 Min', value: '2 minutes' },
                  { label: '3 Min', value: '3 minutes' }
                ].map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all ${duration === d.value ? 'bg-[#dc2626] text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'bg-black text-gray-400 border border-[#dc2626]/30 hover:border-[#dc2626]'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 items-center pt-2">
            <div className="flex-1">
              <label className="text-[7px] text-gray-500 uppercase font-black block mb-1">Neural Context (Optional)</label>
              <div className="relative">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="bg-black border border-[#dc2626]/30 rounded-lg p-2 text-[8px] text-gray-400 flex items-center gap-2 hover:border-[#dc2626] transition-colors">
                  <i className="fas fa-upload text-[#dc2626]"></i>
                  <span className="truncate">{uploadedFile ? uploadedFile.name : 'Upload image/file for reference'}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className={`px-8 py-3 rounded-full font-black text-[10px] uppercase transition-all shadow-xl ${isGenerating ? 'bg-white text-black' : 'bg-gradient-to-r from-[#dc2626] to-[#991b1b] text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:hover:scale-100'}`}
            >
              {isGenerating ? 'Synthesizing...' : `Generate ${type}`}
            </button>
          </div>
        </div>
      </div>

      {resultUrl && (
        <div className="bg-[#0f0f0f] border border-[#dc2626] p-4 rounded-lg animate-in">
          <h3 className="text-[8px] font-black text-[#dc2626] uppercase tracking-[0.3em] mb-4">Neural Output</h3>
          <div className="relative rounded-xl overflow-hidden border border-[#dc2626]/30 bg-black aspect-video flex items-center justify-center">
            {type === 'image' ? (
              <img src={resultUrl || undefined} alt="Generated" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            ) : type === 'video' ? (
              <video src={resultUrl || undefined} controls className="max-w-full max-h-full" />
            ) : (
              <audio src={resultUrl || undefined} controls className="w-full px-8" />
            )}
            <div className="absolute top-2 right-2 flex gap-2">
              <a href={resultUrl || undefined} download={`generated-${type}`} className="bg-black/80 p-2 rounded text-white hover:text-[#dc2626] transition-all border border-[#dc2626]/50">
                <i className="fas fa-download text-xs"></i>
              </a>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="bg-[#0f0f0f] border border-[#dc2626] p-12 rounded-lg flex flex-col items-center justify-center">
          <div className="w-12 h-12 mb-4 relative">
            <div className="absolute inset-0 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin"></div>
            <i className={`fas ${type === 'image' ? 'fa-image' : type === 'video' ? 'fa-film' : 'fa-music'} text-[#dc2626] text-sm absolute inset-0 flex items-center justify-center animate-pulse`}></i>
          </div>
          <p className="text-[8px] font-black text-[#dc2626] uppercase tracking-widest animate-pulse">Orchestrating Neural Assets...</p>
          {type !== 'image' && (
            <p className="text-[7px] text-gray-500 uppercase mt-2">Target Duration: {duration} (May take longer to synthesize)</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaCreators;
