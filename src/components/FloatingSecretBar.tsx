import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, LogOut, Loader2, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface FloatingSecretBarProps {
  onRefresh: () => void;
  onExit: () => void;
  onTriggerAI: () => void;
}

export default function FloatingSecretBar({ onRefresh, onExit, onTriggerAI }: FloatingSecretBarProps) {
  const [time, setTime] = useState('');
  const [battery, setBattery] = useState('85%');
  const [isLocked, setIsLocked] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Auto-hide after 5 seconds of inactivity
    resetHideTimer();

    return () => {
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const resetHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  const handleInteraction = () => {
    setIsVisible(true);
    resetHideTimer();
  };

  const handleTouchStart = () => {
    handleInteraction();
    timerRef.current = setTimeout(() => {
      onTriggerAI();
    }, 2000);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const toggleLock = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsLocked(!isLocked);
    handleInteraction();
  };

  return (
    <>
      {/* Invisible Trigger Area (Sensor) */}
      <div 
        className="absolute top-0 left-0 right-0 h-12 z-[90] pointer-events-auto"
        onMouseMove={handleInteraction}
        onTouchStart={handleInteraction}
        onClick={handleInteraction}
      />

      <div className="absolute top-2 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
        <AnimatePresence>
          {isVisible && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full h-11 px-4 flex items-center gap-5 pointer-events-auto shadow-2xl select-none"
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={handleInteraction}
            >
              {/* Left: Refresh */}
              <button 
                onClick={(e) => { e.stopPropagation(); onRefresh(); handleInteraction(); }}
                className="text-white/40 hover:text-white/80 transition-colors"
                disabled={isLocked}
              >
                <RotateCcw size={16} className={isLocked ? "opacity-20" : ""} />
              </button>

              {/* Middle: Lock Toggle */}
              <button 
                onClick={toggleLock}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center justify-center",
                  isLocked ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-white/10 text-white/60"
                )}
              >
                {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>

              {/* Status: Battery & Time */}
              <div className="flex items-center gap-3 text-white/50 text-[10px] font-mono tracking-tight font-medium">
                 <div className="flex flex-col items-center leading-none">
                   <span>{battery}</span>
                   <span className="text-[7px] text-white/20">--:--</span>
                 </div>
                 <div className="w-px h-3 bg-white/10" />
                 <span>{time}</span>
              </div>

              {/* Right: Exit */}
              <button 
                onClick={(e) => { 
                  if (isLocked) return;
                  e.stopPropagation(); 
                  onExit(); 
                }}
                className={cn(
                  "transition-colors",
                  isLocked ? "text-white/10 cursor-not-allowed" : "text-white/40 hover:text-white/80"
                )}
              >
                <LogOut size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
