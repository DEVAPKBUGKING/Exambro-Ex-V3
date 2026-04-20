import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, User, Minimize2, Eye } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/src/lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  hasImage?: boolean;
}

interface AIChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: () => Promise<string | null>;
}

export default function AIChatOverlay({ isOpen, onClose, onCapture }: AIChatOverlayProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    const userMessage: Message = { role: 'user', content: currentInput };
    
    // Check if user is asking AI to see/answer based on screen
    let screenshot: string | null = null;
    const visionTriggers = ['jawab', 'lihat', 'layar', 'ini', 'screen', 'answer'];
    const needsVision = visionTriggers.some(t => currentInput.toLowerCase().includes(t));

    if (needsVision) {
      userMessage.hasImage = true;
      setIsLoading(true); // Show loading while capturing
      screenshot = await onCapture();
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const contents: any[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // Add user message parts
      const userParts: any[] = [{ text: currentInput }];
      if (screenshot) {
        userParts.push({
          inlineData: {
            mimeType: "image/png",
            data: screenshot
          }
        });
      }
      contents.push({ role: 'user', parts: userParts });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: "Kamu adalah asisten pintar 'Exambro Diagnostic' yang terintegrasi di browser ujian. Kamu memiliki kemampuan untuk melihat layar pengguna saat diminta. Berikan jawaban yang sangat singkat, padat, dan akurat untuk membantu siswa. Gunakan bahasa Indonesia.",
        }
      });

      const modelResponse: Message = { 
        role: 'model', 
        content: response.text || "Maaf, saya tidak bisa memproses permintaan itu." 
      };
      setMessages(prev => [...prev, modelResponse]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Error terminal. Sinyal lemah atau sesi berakhir." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[65vh]"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[10px] font-mono text-zinc-400 tracking-[0.2em] uppercase">Exambro Diagnostic Terminal</span>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-950 font-mono text-[13px]"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-20 text-blue-500">
                  <Bot size={64} strokeWidth={1} />
                  <p className="mt-4 text-[10px] tracking-widest">AWAITING INPUT_</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex gap-3",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center shrink-0",
                    m.role === 'user' ? "bg-blue-600/20 text-blue-400" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={cn(
                    "flex flex-col gap-2 max-w-[80%]",
                    m.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-3 py-2 rounded-lg leading-relaxed",
                      m.role === 'user' ? "bg-blue-600/10 text-blue-100 border border-blue-600/20" : "bg-zinc-800/50 text-zinc-300 border border-zinc-700"
                    )}>
                      {m.content}
                      {m.hasImage && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-blue-400/60 italic border-t border-blue-400/10 pt-2">
                           <Eye size={12} /> Screen capture attached
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="text-blue-500 animate-pulse text-[10px]">PROCESSING_REQUEST...</div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="EXECUTE COMMAND_"
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-zinc-300 focus:outline-none focus:border-blue-600 transition-colors font-mono"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-30"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
