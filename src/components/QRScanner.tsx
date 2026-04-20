import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Maximize, Flashlight, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qrCodeInstance = new Html5Qrcode("qr-reader");
    setHtml5QrCode(qrCodeInstance);

    const startCamera = async () => {
      try {
        await qrCodeInstance.start(
          { facingMode: "environment" },
          {
            fps: 25,
            qrbox: { width: 280, height: 280 },
          },
          (decodedText) => {
            onScan(decodedText);
            qrCodeInstance.stop().catch(console.error);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera start error:", err);
        setError("Gagal mengakses kamera. Pastikan izin diberikan.");
      }
    };

    startCamera();

    return () => {
      if (qrCodeInstance.isScanning) {
        qrCodeInstance.stop().catch(console.error);
      }
    };
  }, [onScan]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !html5QrCode) return;

    const file = e.target.files[0];
    setError(null);
    
    try {
      // Menggunakan scanFile dengan parameter 'experimentalFeatures' diaktifkan jika didukung
      // html5-qrcode scanFile internally handles basic rotations and inverse QRs
      // Parameter kedua (true) adalah untuk mencoba scan dengan gambar yang di-mirror/balik
      const decodedText = await html5QrCode.scanFile(file, true);
      onScan(decodedText);
    } catch (err) {
      console.error("File scan error:", err);
      // Jika gagal pertama kali, kita coba beri tips ke user atau mencoba mode pemindaian yang lebih agresif
      // Library html5-qrcode sudah cukup bagus menangani rotasi jika 'true' dilewatkan sebagai argumen kedua
      setError("QR tidak terbaca. Pastikan gambar jelas & tidak terlalu buram.");
      setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />

      {/* Top Controls */}
      <div className="absolute top-6 left-0 right-0 z-30 flex justify-between px-8 items-center text-white pointer-events-auto">
        <button onClick={onClose} className="p-2 bg-black/20 backdrop-blur-md rounded-full">
          <Maximize size={22} className="opacity-90" />
        </button>
        <div className="flex gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
            title="Pilih dari Galeri"
          >
            <ImageIcon size={22} className="opacity-90" />
          </button>
          <button className="p-2 bg-black/20 backdrop-blur-md rounded-full">
            <Flashlight size={22} className="opacity-90" />
          </button>
        </div>
      </div>

      {/* Main Scanner Area */}
      <div id="qr-reader" className="absolute inset-0 z-0" />
      
      {/* Overlay UI */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        <div className="h-[20%] bg-black/50" />
        <div className="flex flex-row">
          <div className="flex-1 bg-black/50" />
          <div className="w-[280px] h-[280px] border-2 border-white/20 rounded-3xl relative">
            {/* Corners */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white translate-x-1 translate-y-1 rounded-br-2xl" />
            
            {/* Scanning Line Animation */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-[scan_2s_linear_infinite]" />
          </div>
          <div className="flex-1 bg-black/50" />
        </div>
        <div className="flex-1 bg-black/50 flex flex-col items-center justify-start pt-12 px-8 gap-6 pointer-events-auto">
          {error && (
            <div className="bg-red-500 text-white px-5 py-2 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* QR Enhanced Toggle */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-2xl flex items-center gap-4">
             <span className="text-[11px] font-black text-white uppercase tracking-wider">QR Diperkuat</span>
             <button 
                onClick={() => setIsEnhanced(!isEnhanced)}
                className={`w-12 h-6 rounded-full transition-all relative ${isEnhanced ? 'bg-blue-600' : 'bg-white/20'}`}
             >
                <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-transform ${isEnhanced ? 'translate-x-7' : 'translate-x-1'}`} />
             </button>
          </div>
          
          <div className="text-center">
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Aktifkan QR Diperkuat untuk scan<br/>
              Arahkan kamera ke kode QR
            </p>
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm shadow-xl active:scale-95 transition-transform"
          >
            <ImageIcon size={20} />
            PILIH DARI GALERI
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        #qr-reader { border: none !important; width: 100% !important; height: 100% !important; }
        #qr-reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
      `}} />
    </div>
  );
}
