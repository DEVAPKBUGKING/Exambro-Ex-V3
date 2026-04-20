/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
   Globe, 
  ArrowLeft,
  RefreshCw,
  MoreVertical,
  VolumeX,
  Lock,
  Home,
  User,
  Zap,
  Mail,
  FilePlus,
  FolderOpen,
  Plus,
  Search,
  ChevronRight,
  CheckCircle,
  Palette,
  Key,
  Info,
  MessageSquare,
  FileText,
  ShieldAlert,
  LogIn,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import AIChatOverlay from './components/AIChatOverlay';
import QRScanner from './components/QRScanner';
import FloatingSecretBar from './components/FloatingSecretBar';

// Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

type Screen = 'loading' | 'login' | 'home' | 'scanner' | 'scanResult' | 'browser' | 'profile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [examUrl, setExamUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setCurrentScreen('home');
      } else if (currentScreen !== 'loading') {
        setCurrentScreen('login');
      }
    });

    // Handle the redirect result (Crucial for APK/WebView)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const email = result.user.email || '';
          if (email && !email.endsWith('@smp.belajar.id')) {
            signOut(auth);
            setLoginError('Akses ditolak. Gunakan akun @smp.belajar.id');
            setCurrentScreen('login');
          } else if (email) {
            setCurrentScreen('home');
          }
        }
      })
      .catch((error) => {
        console.error("Redirect error:", error);
        if (!error.message.includes('process is being protected')) {
          setLoginError("Login gagal. Cek koneksi Anda.");
        }
      });

    return () => unsubscribe();
  }, [currentScreen]);

  useEffect(() => {
    // Simulated splash screen
    const timer = setTimeout(() => {
       const savedUrl = localStorage.getItem('last_exam_url');
       if (savedUrl) setExamUrl(savedUrl);
       
       if (auth.currentUser) {
         setCurrentScreen('home');
       } else {
         setCurrentScreen('login');
       }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      
      // Detect if we are in a mobile WebView (like Kodular/APK)
      const userAgent = navigator.userAgent || '';
      const isWebView = /wv|Kodular|BuiltWithKodular/i.test(userAgent);
      
      if (isWebView) {
        // Use Redirect for APK/Kodular to avoid white screen popup issues
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Use Popup for normal desktop browser preview
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email || '';
        
        if (!email.endsWith('@smp.belajar.id')) {
          await signOut(auth);
          setLoginError('Akses ditolak. Gunakan akun @smp.belajar.id');
          return;
        }
        
        setCurrentScreen('home');
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      setLoginError('Gagal login. Silakan coba lagi.');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleScan = (url: string) => {
    localStorage.setItem('last_exam_url', url);
    setExamUrl(url);
    setCurrentScreen('scanResult');
  };

  const startBrowser = (url?: string) => {
    const finalUrl = url || urlInput;
    if (finalUrl.trim()) {
      let formattedUrl = finalUrl.trim();
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      setExamUrl(formattedUrl);
      setCurrentScreen('browser');
      // Auto fullscreen when entering exam
      if (!document.fullscreenElement) toggleFullscreen();
    }
  };

  // Function to capture screen for AI
  const captureScreen = async (): Promise<string | null> => {
    try {
      // In a real browser, this opens a picker. In an iframe, it might be restricted.
      // But we can try using the native MediaDevices API.
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      
      return canvas.toDataURL('image/png').split(',')[1];
    } catch (err) {
      console.error("Screen capture failed:", err);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden relative h-screen">
      <AIChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onCapture={captureScreen}
      />
      
      {/* Universal Secret Trigger (Top Edge) */}
      <div 
        className="absolute top-0 left-0 right-0 h-4 z-[1000] pointer-events-auto"
        onContextMenu={(e) => { e.preventDefault(); setIsChatOpen(true); }}
        onDoubleClick={() => setIsChatOpen(true)}
        title="Double Click secret zone"
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        <AnimatePresence mode="wait">
          {currentScreen === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-slate-900 overflow-hidden"
            >
              <div className="z-10 flex flex-col items-center">
                <div className="bg-white rounded-[56px] p-10 mb-8 shadow-2xl relative">
                  <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full" />
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center relative z-10">
                     <span className="text-6xl font-black italic text-white tracking-tighter">EX</span>
                  </div>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-2">Exambro Pro</h1>
                <div className="mt-20 w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
                   <motion.div 
                      key="loader"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.5, ease: "easeInOut" }}
                      className="absolute inset-0 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                   />
                </div>
                <p className="mt-4 text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Beban Keamanan Aktif...</p>
              </div>
            </motion.div>
          )}

          {currentScreen === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col bg-[#f8fbff] items-center justify-center p-8 text-center"
            >
               <div className="bg-blue-100 p-8 rounded-[40px] mb-8">
                 <ShieldCheck size={80} className="text-blue-600" />
               </div>
               <h1 className="text-2xl font-black text-slate-800">Login untuk melanjutkan</h1>
               <p className="text-sm text-slate-500 mt-4 max-w-xs">
                 Untuk mengisi formulir ini, Anda harus login. Gunakan akun <span className="font-bold text-blue-600">@smp.belajar.id</span> Anda.
               </p>

               {loginError && (
                 <div className="mt-6 bg-red-100 text-red-600 text-xs font-bold px-4 py-2 rounded-xl">
                   {loginError}
                 </div>
               )}

               <button 
                 onClick={handleLogin}
                 className="mt-12 w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-4 rounded-2xl font-bold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
               >
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6" alt="Google" />
                 Lanjutkan dengan Google
               </button>
               
               <p className="mt-8 text-[10px] text-slate-400">Identitas Anda akan tetap anonim. <span className="underline">Laporkan Penyalahgunaan</span></p>
            </motion.div>
          )}

          {currentScreen === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col bg-[#f8fbff]"
            >
              <div className="p-6 pb-2">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-blue-500 text-sm font-medium">Halo, {user?.displayName?.split(' ')[0] || 'Siswa'} 👋</p>
                      <h1 className="text-3xl font-black text-slate-800">Beranda</h1>
                   </div>
                   <button onClick={toggleFullscreen} className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                      <Maximize2 size={24} />
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-24">
                <Banner />
                <UrlInput urlInput={urlInput} setUrlInput={setUrlInput} onStart={() => startBrowser()} />
                <QuickMenu setScreen={(s) => setCurrentScreen(s as any)} />
                <ModeQuiz />
                <TokenCepat />
              </div>
              <BottomNav current="home" onPath={(p) => setCurrentScreen(p as any)} />
            </motion.div>
          )}

          {currentScreen === 'scanner' && (
            <motion.div key="scanner" className="fixed inset-0 z-50 flex flex-col bg-black">
              <QRScanner 
                onScan={handleScan} 
                onClose={() => {
                   if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                   setCurrentScreen('home');
                }} 
              />
            </motion.div>
          )}

          {currentScreen === 'scanResult' && (
             <motion.div key="scanResult" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col bg-[#f0f4ff] p-8">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                   <div className="bg-green-100 p-6 rounded-full"><CheckCircle size={80} className="text-green-500" /></div>
                   <h1 className="text-2xl font-black text-slate-800">Scan Berhasil</h1>
                   <div className="w-full bg-white rounded-3xl mt-12 overflow-hidden border border-slate-100 shadow-sm p-6 text-left">
                      <p className="text-xs font-bold text-blue-600 mb-4">Informasi Ujian</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL</p>
                      <p className="text-xs font-medium text-slate-600 truncate mt-1">{examUrl}</p>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-4 mb-24">
                   <button onClick={() => startBrowser(examUrl)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg active:scale-95 transition-transform">Lanjut</button>
                </div>
                <BottomNav current="qr" onPath={(p) => setCurrentScreen(p as any)} />
             </motion.div>
          )}

          {currentScreen === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col bg-[#f8fbff]">
              <div className="p-8">
                <h1 className="text-4xl font-black text-blue-900 mb-8">Profil</h1>
                <ProfileHeader user={user} />
                <div className="mt-8 space-y-8">
                   <ProfileSection title="Pengaturan" items={[{ icon: <Palette/>, label: "Tema" }, { icon: <Key/>, label: "Izin Aplikasi" }]} />
                   <ProfileSection title="Bantuan & Info" items={[{ icon: <Info/>, label: "Tentang" }, { icon: <MessageSquare/>, label: "Beri Ulasan" }]} />
                   <button onClick={() => auth.signOut()} className="w-full py-4 text-red-500 font-bold border-2 border-slate-100 rounded-[24px]">Keluar</button>
                </div>
              </div>
              <BottomNav current="profile" onPath={(p) => setCurrentScreen(p as any)} />
            </motion.div>
          )}

          {currentScreen === 'browser' && (
            <motion.div key="browser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col bg-white">
              {/* Floating Secret Toolset */}
              <FloatingSecretBar 
                onRefresh={() => {
                   const iframe = document.querySelector('iframe');
                   if (iframe) iframe.src = iframe.src;
                }}
                onExit={() => {
                   if (document.fullscreenElement) document.exitFullscreen();
                   setCurrentScreen('home');
                }}
                onTriggerAI={() => setIsChatOpen(true)}
              />
              
              <div className="flex-1 bg-white relative">
                <iframe 
                  src={examUrl} 
                  className="w-full h-full border-none" 
                  title="Exam"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden AI Chat Overlay with Vision Support */}
      <AIChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onCapture={captureScreen}
      />
    </div>
  );
}

// Subcomponents extracted for brevity
function ShieldCheck(props: any) { return <ShieldAlert {...props} /> }
function Banner() { return <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-lg"><h2 className="text-4xl font-black leading-tight">Keep<br/>learning</h2><div className="mt-4 bg-white/20 backdrop-blur-md rounded-full px-4 py-1 inline-block text-[10px] font-bold">PAUSE</div><div className="absolute -right-4 -bottom-4 opacity-30 rotate-12"><Globe size={112} /></div></div>; }
function UrlInput({ urlInput, setUrlInput, onStart }: any) { return <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100"><h3 className="text-sm font-bold mb-4">Masuk Ujian</h3><div className="relative flex items-center gap-3"><div className="flex-1 relative"><input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="URL atau token" className="w-full bg-[#f0f4ff] rounded-2xl pl-12 pr-4 py-4 text-sm"/><QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20}/></div><button onClick={onStart} className="bg-blue-600 text-white p-4 rounded-2xl"><Search size={22} className="rotate-90"/></button></div></div>; }
function QuickMenu({ setScreen }: any) { return <section><h3 className="text-sm font-bold mb-4">Menu Cepat</h3><div className="grid grid-cols-3 gap-3"><QuickMenuCard icon={<Zap className="text-yellow-400" />} label="Buat Token" /><QuickMenuCard icon={<Mail className="text-cyan-400" />} label="Pesan" /><QuickMenuCard icon={<QrCode className="text-blue-500" />} label="Buat QR" onClick={() => setScreen('scanner')} /></div></section>; }
function ModeQuiz() { return <section><h3 className="text-sm font-bold mb-4">Mode Quiz</h3><div className="grid grid-cols-2 gap-4"><div className="bg-yellow-50 rounded-3xl p-5 h-32 flex flex-col justify-between"><FilePlus className="text-yellow-500/20" size={48}/><span className="font-black">QUIZ</span></div><div className="bg-cyan-50 rounded-3xl p-5 h-32 flex flex-col justify-between"><FolderOpen className="text-cyan-500/20" size={48}/><span className="font-black italic">UIZ TIME</span></div></div></section>; }
function TokenCepat() { return <section><h3 className="text-sm font-bold mb-4 text-blue-900">Token Cepat</h3><div className="flex gap-4"><button className="w-16 h-16 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center text-blue-400"><Plus size={32} /></button></div></section>; }
function QuickMenuCard({ icon, label, onClick }: any) { return <div onClick={onClick} className="bg-white rounded-3xl border border-slate-100 flex flex-col cursor-pointer"><div className="bg-slate-800 p-4 flex items-center justify-center rounded-t-3xl">{React.cloneElement(icon, { size: 32 })}</div><div className="p-3 text-center text-[10px] font-bold">{label}</div></div>; }
function BottomNav({ current, onPath }: { current: string, onPath: (p: string) => void }) { return <div className="absolute bottom-0 left-0 right-0 bg-[#e0eafb]/80 backdrop-blur-lg border-t border-white/20 px-8 py-3 flex justify-between items-center z-30"><NavItem icon={<Home/>} label="Beranda" active={current === 'home'} onClick={() => onPath('home')} /><NavItem icon={<QrCode/>} label="QR" active={current === 'qr'} onClick={() => onPath('scanner')} /><NavItem icon={<User/>} label="Profil" active={current === 'profile'} onClick={() => onPath('profile')} /></div>; }
function NavItem({ icon, label, active, onClick }: any) { return <button onClick={onClick} className={cn("flex flex-col items-center gap-1", active ? "text-blue-600 scale-110" : "text-slate-400")}><div className={cn("p-2 rounded-2xl", active && "bg-blue-600/10")}>{React.cloneElement(icon, { size: 24 })}</div><span className="text-[10px] font-bold">{label}</span></button>; }
function ProfileHeader({ user }: any) { return <div className="bg-white rounded-[32px] p-6 border border-slate-100 flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">{user?.displayName?.[0] || 'E'}</div><h2 className="text-lg font-black">{user?.displayName || 'Exambro App'}</h2></div><ChevronRight className="text-slate-300" /></div>; }
function ProfileSection({ title, items }: any) { return <section><h3 className="text-xs font-bold text-slate-400 uppercase mb-4 px-2 tracking-widest">{title}</h3><div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">{items.map((it: any, i: number) => <ProfileItem key={i} {...it} isLast={i === items.length -1} />)}</div></section>; }
function ProfileItem({ icon, label, isLast }: any) { return <div className={cn("flex items-center justify-between p-4 cursor-pointer", !isLast && "border-b border-slate-50")}><div className="flex items-center gap-4"><div className="p-2 bg-blue-600 rounded-xl text-white">{React.cloneElement(icon, { size: 18 })}</div><span className="text-sm font-bold">{label}</span></div><ChevronRight size={18} className="text-slate-300" /></div>; }
