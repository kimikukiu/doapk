import { useState, useCallback, useRef } from 'react';
import { analyzeTarget } from '../../services/geminiService';

interface AIStatus {
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  logs: string[];
  result?: string;
  error?: string;
}

export const useAIAnalysis = () => {
  const [status, setStatus] = useState<AIStatus>({
    status: 'IDLE',
    progress: 0,
    logs: []
  });
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const startAnalysis = useCallback(async (subject: string, useExternalApi: boolean = false) => {
    setStatus({ status: 'PROCESSING', progress: 0, logs: ['Initializing...'] });
    
    if (useExternalApi) {
      try {
        const response = await fetch('http://127.0.0.1:5500/generate_report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, context: "Epstein Network Node" })
        });
        
        if (!response.ok) throw new Error('Server connection failed');
        
        const data = await response.json();
        const taskId = data.task_id;
        
        // Start Polling
        if (pollInterval.current) clearInterval(pollInterval.current);
        
        pollInterval.current = setInterval(async () => {
          try {
            const res = await fetch(`http://127.0.0.1:5500/task_status?id=${taskId}`);
            const taskData = await res.json();
            
            setStatus(prev => ({
              ...prev,
              status: taskData.status,
              progress: taskData.progress,
              logs: taskData.logs || prev.logs,
              result: taskData.result,
              error: taskData.error
            }));
            
            if (taskData.status === 'COMPLETED' || taskData.status === 'FAILED') {
              if (pollInterval.current) clearInterval(pollInterval.current);
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }, 1000);
        
      } catch (e: any) {
        setStatus(prev => ({ ...prev, status: 'FAILED', error: e.message }));
      }
    } else {
      // Use internal GPT
      try {
        setStatus(prev => ({ ...prev, logs: [...prev.logs, 'Connecting to internal core...'] }));
        const result = await analyzeTarget(subject, 'full', 'Forensic Reaper', true);
        setStatus({
          status: 'COMPLETED',
          progress: 100,
          logs: ['Initializing...', 'Connecting to internal core...', 'Analysis complete.'],
          result: result.summary,
        });
      } catch (e: any) {
        setStatus(prev => ({ ...prev, status: 'FAILED', error: e.message }));
      }
    }
  }, []);

  const updateApiKey = useCallback(async (key: string) => {
    try {
      await fetch('http://127.0.0.1:5500/update_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key })
      });
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  return { status, startAnalysis, updateApiKey };
};
