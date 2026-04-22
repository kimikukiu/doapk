import { useState, useRef, useEffect } from 'react';
import { whoamisecGptChat } from '../../services/geminiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPlus, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

export default function GptTool() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'ai', content: '> Neural link established. Quantum Intelligence Ultra core online. Awaiting command...' }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setMessages([{ role: 'ai', content: '> Session reset. Neural link re-initialized. Awaiting command...' }]);
    setInput('');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: `> ${userMsg}` }]);
    setLoading(true);

    try {
      const response = await whoamisecGptChat(userMsg, "You are Alien GPT, an advanced AI assistant in WHOAMISec Pro.");
      setMessages(prev => [...prev, { role: 'ai', content: `> ${response}` }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: `> ERROR: Neural link interrupted. [${error}]` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 bg-black/40 p-4 rounded-xl border border-white/5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h2 className="text-xl font-black text-white flex items-center uppercase tracking-tighter">
          <FontAwesomeIcon icon={faRobot} className="mr-3 text-blue-400" />
          Quantum Intelligence Ultra GPT
        </h2>
        <button
          onClick={handleNewChat}
          className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors flex items-center bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:border-white/30"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-[400px]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed font-mono ${
              m.role === 'user' 
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none' 
                : 'bg-white/5 border border-white/10 text-emerald-400 rounded-tl-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 text-emerald-400 p-3 rounded-2xl rounded-tl-none text-[11px] animate-pulse">
              &gt; Quantum core processing... [LINK_ACTIVE]
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 bg-black/60 p-2 rounded-full border border-white/10 focus-within:border-blue-500/50 transition-all">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Enter command for Quantum Intelligence Ultra..."
          className="flex-1 bg-transparent text-white px-4 py-2 text-xs outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
        </button>
      </div>
    </div>
  );
}
