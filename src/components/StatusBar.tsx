import React, { useState, useEffect, useRef } from 'react';
import { Battery, Wifi, Signal } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface StatusBarProps {
  onSecretTrigger: () => void;
}

export default function StatusBar({ onSecretTrigger }: StatusBarProps) {
  const [time, setTime] = useState(new Date());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      onSecretTrigger();
    }, 2000); // 2 second hold
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <div 
      className="flex justify-between items-center px-4 py-1 bg-blue-900 text-white text-xs select-none cursor-default"
      onMouseDown={startPress}
      onMouseUp={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
    >
      <div className="flex items-center gap-1">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Signal size={14} />
        <Wifi size={14} />
        <div className="flex items-center gap-0.5">
          <span className="text-[10px]">98%</span>
          <Battery size={14} className="rotate-90" />
        </div>
      </div>
    </div>
  );
}
