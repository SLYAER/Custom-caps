import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Upload,
  ShoppingBag,
  Layers,
  Sparkles,
  ArrowRight,
  Droplets,
  Calendar,
  Type,
  Palette,
  Eye,
  CreditCard,
  Check,
  LogOut,
  Mail,
  Lock,
  Loader2,
  RotateCw,
  Truck,
  Package,
  Menu,
  X
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { Canvas } from '@react-three/fiber';
import { StarfieldBackground } from './components/Starfield';
import { auth, db } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';

import { Bottle3DPreview } from './Bottle3D';
import { processAndCropImage } from './lib/imageUtils';
const MATERIALS = [
  { id: 'glass', name: 'Premium Glass', price: 99, icon: <Droplets className="w-6 h-6 text-blue-400" />, desc: 'Crystal clear, eco-friendly & durable.' },
  { id: 'stainless', name: 'Borosil Cylindrical', price: 199, icon: <Layers className="w-6 h-6 text-neutral-400" />, desc: 'Matte finish with a carry strap ring.' },
  { id: 'plastic', name: 'Sports Plastic', price: 69, icon: <Box className="w-6 h-6 text-emerald-400" />, desc: 'Lightweight & perfect for sports.' },
];

const calculatePrice = (selection: any) => {
    let price = selection.material.price;
    if (selection.material.id === 'plastic' && selection.occasion.id === 'sports') {
        price = 69;
    } else if (selection.material.id === 'glass') {
        price = 99;
    }
    const sizeObj = SIZES.find(s => s.id === selection.size);
    if (sizeObj) {
        price += sizeObj.priceAdd;
    }
    return price;
};


const OCCASIONS = [
  { id: 'birthday', name: 'Birthday Bash', desc: 'Party themes & age decals', defaultText: 'HAPPY BIRTHDAY', defaultColor: '#EC4899', symbol: '🎂' },
  { id: 'wedding', name: 'Wedding Favors', desc: 'Elegant script & dates', defaultText: 'SAVE THE DATE', defaultColor: '#8B5CF6', symbol: '💍' },
  { id: 'corporate', name: 'Corporate Gift', desc: 'Minimal branding & logos', defaultText: 'YOUR BRAND', defaultColor: '#3B82F6', symbol: '🏢' },
  { id: 'sports', name: 'Athletics', desc: 'Performance tracking & names', defaultText: 'CHAMPION', defaultColor: '#EF4444', symbol: '🏆' },
  { id: 'minimal', name: 'Minimalist', desc: 'Pure design, no theme', defaultText: 'YOUR TEXT', defaultColor: '#FFFFFF', symbol: '' },
];

const COLORS = [
  '#06B6D4', '#8B5CF6', '#EC4899', '#EF4444', 
  '#F59E0B', '#10B981', '#FFFFFF', '#6B7280', '#000000', '#3B82F6'
];

const SHAPES = [
  { id: 'slim', name: 'Elite Slim', radius: 0.8, height: 5 },
  { id: 'standard', name: 'Classic', radius: 1, height: 4.5 },
  { id: 'wide', name: 'Rugged Wide', radius: 1.3, height: 3.5 },
];

const SIZES = [
  { id: '500ml', name: '500ml', priceAdd: 0 },
  { id: '750ml', name: '750ml', priceAdd: 100 },
  { id: '1L', name: '1L', priceAdd: 250 },
];

type Step = 'material' | 'occasion' | 'design' | 'review' | 'about' | 'admin' | 'orders' | 'profile';

// --- Realistic Preview Component ---
import { AboutPage } from './About';
import { AdminPanel } from './AdminPanel';
import { BasketPanel } from './components/BasketPanel';
import { UserProfile } from './UserProfile';
function BottleRealisticPreview({ selection }: { selection: any }) {
  const isGlass = selection.material.id === 'glass';
  const isMetal = selection.material.id === 'stainless';
  const isPlastic = selection.material.id === 'plastic';

  let bodyWidth = 180;
  let bodyHeight = 400;
  let shoulderRadius = 80;

  if (selection.shape === 'slim') {
    bodyWidth = 140;
    bodyHeight = 450;
    shoulderRadius = 60;
  } else if (selection.shape === 'wide') {
    bodyWidth = 220;
    bodyHeight = 360;
    shoulderRadius = 90;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 select-none overflow-hidden">
      <motion.div 
        key={selection.material.id + selection.shape + selection.bottleColor}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-center justify-end drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] mt-8"
      >
        
        {/* --- CAP --- */}
        <div className="relative z-20 shrink-0 flex flex-col items-center">
            {isMetal ? (
               <>
                  <div className="w-[52px] h-[10px] bg-gradient-to-b from-neutral-200 to-neutral-400 rounded-t-lg border-b border-black/20" />
                  <div className="w-[50px] h-[35px] relative rounded-b-md shadow-lg bg-[linear-gradient(90deg,#222_0%,#555_15%,#aaa_25%,#555_40%,#222_80%,#000_100%)] overflow-hidden">
                    <div className="absolute inset-0 flex justify-evenly opacity-40">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="w-[1px] h-full bg-black/50" />
                        ))}
                    </div>
                  </div>
               </>
            ) : (
               <>
                  <div className="w-[52px] h-[8px] bg-gradient-to-b from-neutral-800 to-black rounded-t-lg" />
                  <div className="w-[50px] h-[35px] relative rounded-b-sm shadow-lg bg-black overflow-hidden">
                     <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_10%,rgba(255,255,255,0.3)_25%,transparent_40%,transparent_80%,rgba(255,255,255,0.1)_90%)]" />
                     {/* Grip */}
                     <div className="absolute inset-0 flex justify-evenly opacity-30">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-[1.5px] h-full bg-gradient-to-r from-black via-transparent to-white/50" />
                        ))}
                     </div>
                  </div>
               </>
            )}
        </div>

        {/* --- NECK --- */}
        <div className="relative z-10 -mt-1 w-[46px] h-[25px] shrink-0"
             style={{
                backgroundColor: selection.bottleColor,
                opacity: isGlass ? 0.8 : 1,
             }}>
             {/* Neck Lighting */}
             <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-white/40 to-black/90" />
             <div className="absolute inset-0 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]" />
             {isMetal && <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.6)_20%,transparent_100%)] mix-blend-overlay" />}
        </div>

        {/* --- BODY --- */}
        <div className="relative shrink-0 transition-all duration-500 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border border-white/5"
             style={{
               width: bodyWidth,
               height: bodyHeight,
               backgroundColor: selection.bottleColor,
               backdropFilter: isGlass ? 'blur(12px)' : 'none',
               borderRadius: `${shoulderRadius}px ${shoulderRadius}px 32px 32px`,
               opacity: isGlass && selection.bottleColor === '#ffffff' ? 0.7 : isGlass ? 0.85 : 1,
             }}>
             
             {/* Base Translucency / Metal Effect */}
             {isGlass && (
                <div className="absolute inset-0 bg-white/10" />
             )}
             {isMetal && (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_100%)] opacity-30" />
             )}

             {/* Primary Highlights & Core Shadows */}
             <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(255,255,255,0.05)_10%,rgba(255,255,255,0.7)_25%,rgba(255,255,255,0.1)_35%,transparent_50%,rgba(0,0,0,0.3)_80%,rgba(0,0,0,0.85)_100%)] mix-blend-overlay pointer-events-none" />
             
             {/* Secondary Edge Shadows to wrap the cylinder */}
             <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,transparent_15%,transparent_85%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />

             {/* Glass/Plastic Specific Reflections */}
             {(isGlass || isPlastic) && (
               <>
                 <div className="absolute top-0 right-6 w-3 h-full bg-gradient-to-b from-white/20 to-transparent blur-sm" />
                 <div className="absolute top-12 left-10 w-1 h-2/3 bg-white/40 blur-[1px] rounded-full" />
                 {/* Thick base for glass */}
                 <div className="absolute bottom-0 w-full h-[25px] bg-[linear-gradient(0deg,rgba(0,0,0,0.6)_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] pointer-events-none" />
                 <div className="absolute bottom-[25px] w-full h-[2px] bg-black/20 blur-[1px]" />
               </>
             )}

             {/* Metal Specific Reflections */}
             {isMetal && (
                <>
                  {/* Brushed texture */}
                  <div className="absolute inset-0 opacity-20 mix-blend-multiply flex flex-col justify-evenly">
                     {[...Array(60)].map((_, i) => (
                        <div key={`m-${i}`} className="w-full h-[1px] bg-black/10" />
                     ))}
                  </div>
                  {/* Sharp metal highlight */}
                  <div className="absolute top-0 right-4 w-1 h-full bg-white/10 blur-[1px]" />
                </>
             )}

             {/* --- TEXT CONTENT OVERLAY --- */}
             <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pointer-events-none">
                 {/* Occasion Label */}
                 {selection.occasion.id !== 'minimal' && (
                  <div className="mb-4 flex flex-col items-center gap-1 drop-shadow-md">
                    <span className="text-2xl">{selection.occasion.symbol}</span>
                    <span className="text-[10px] font-bold tracking-[0.4em] text-white/90 uppercase border-y border-white/20 px-2">{selection.occasion.name}</span>
                  </div>
                 )}
                 
                 {/* Main Text Customization */}
                 <span 
                    className="text-[32px] sm:text-[40px] leading-[1.1] font-black tracking-tighter uppercase whitespace-pre-wrap break-words text-center transition-all w-full select-text pointer-events-auto block"
                    style={{ 
                      color: selection.textColor, 
                      fontFamily: selection.textFont,
                      textShadow: selection.textColor === '#000000' || selection.textColor === '#171717'
                        ? '0 1px 1px rgba(255,255,255,0.3)' 
                        : '0 2px 8px rgba(0,0,0,0.6)',
                      transform: `scaleY(0.9) scale(${selection.textScale}) translateY(${(selection.textPosition - 0.4) * 200}px) translateX(${selection.textRotationX * -100}px) rotate(${selection.textRotationZ}rad)`, 
                    }}
                  >
                    {selection.customText || 'YOUR TEXT'}
                 </span>

                 {selection.logo && (
                    <img 
                      src={selection.logo} 
                      alt="Custom Logo" 
                      className="mt-6 w-16 h-16 object-contain opacity-90 drop-shadow-lg filter transition-all absolute"
                      style={{ 
                        filter: selection.textColor === '#ffffff' ? 'brightness(0) invert(1)' : 'brightness(0)',
                        transform: `scale(${selection.logoScale}) translateY(${(selection.logoPosition + 0.6) * 150}px) translateX(${selection.logoRotationX * -100}px)`,
                      }}
                    />
                 )}

                 {!selection.logo && (
                    <div 
                       className="w-16 h-1 mt-6 rounded-full opacity-60 shadow-sm absolute"
                       style={{ 
                         backgroundColor: selection.textColor,
                         transform: `scale(${selection.logoScale}) translateY(${(selection.logoPosition + 0.6) * 150}px)`,
                        }}
                    />
                 )}
             </div>
        </div>

        {/* Base Floor Shadows */}
        <div className="absolute -bottom-4 z-[-1] w-[140%] h-8 bg-black/90 blur-xl rounded-full" />
        <div className="absolute -bottom-2 z-[-1] w-[100%] h-4 bg-black/70 blur-md rounded-full" />
      </motion.div>
    </div>
  );
}

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('material');
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [showMockingPopup, setShowMockingPopup] = useState(() => {
    const time = localStorage.getItem('mockingPopupTime');
    if (time) {
      const elapsed = Date.now() - parseInt(time, 10);
      if (elapsed < 30000) {
        return true;
      } else {
        localStorage.removeItem('mockingPopupTime');
      }
    }
    return false;
  });
  const [mockingTimeLeft, setMockingTimeLeft] = useState(30);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [basket, setBasket] = useState<any[]>([]);
  
  const handleCheckoutComplete = () => {
    localStorage.setItem('mockingPopupTime', Date.now().toString());
    setShowMockingPopup(true);
  };
  const [selection, setSelection] = useState({
    material: MATERIALS[0],
    occasion: OCCASIONS[0],
    shape: 'standard',
    size: '500ml',
    bottleColor: '#FFFFFF',
    capColor: '#171717',
    textColor: '#000000',
    customText: 'CAPS 2024',
    logo: null as string | null,
    textScale: 1,
    textPosition: 0.4,
    textRotationX: 0,
    textRotationZ: 0,
    textFont: 'Inter',
    isMoveEnabled: false,
    logoScale: 1,
    logoPosition: -0.6,
    logoRotationX: 0,
  });

  useEffect(() => {
    if (showMockingPopup) {
      const time = localStorage.getItem('mockingPopupTime');
      let remaining = 30000;
      if (time) {
        remaining = 30000 - (Date.now() - parseInt(time, 10));
      }
      
      if (remaining <= 0) {
        setShowMockingPopup(false);
        localStorage.removeItem('mockingPopupTime');
        return;
      }
      
      setMockingTimeLeft(Math.ceil(remaining / 1000));
      
      const interval = setInterval(() => {
        const storedTime = localStorage.getItem('mockingPopupTime');
        if (storedTime) {
          const currentRemaining = 30000 - (Date.now() - parseInt(storedTime, 10));
          if (currentRemaining <= 0) {
            setShowMockingPopup(false);
            localStorage.removeItem('mockingPopupTime');
            clearInterval(interval);
          } else {
            setMockingTimeLeft(Math.ceil(currentRemaining / 1000));
          }
        }
      }, 500);
      
      const timer = setTimeout(() => {
        setShowMockingPopup(false);
        localStorage.removeItem('mockingPopupTime');
      }, remaining);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [showMockingPopup]);

  useEffect(() => {
    // Proactively clear old logins as requested
    try {
      localStorage.removeItem('sips_preview_email');
      localStorage.removeItem('sips_preview_pass');
    } catch {}
    
    setIsLoaded(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const nextStep = (step: Step) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(step);
  };
  
  const prevStep = (step: Step) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(step);
  };

  if (!isLoaded || authLoading) return (
    <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
      <span className="text-sm font-black tracking-widest uppercase text-neutral-500">Initializing Lab...</span>
    </div>
  );

  if (!user && !isGuest) {
    return <AuthScreen onGuest={() => setIsGuest(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Canvas>
          <StarfieldBackground />
        </Canvas>
      </div>

      <nav className="fixed top-0 w-full z-50 glass-dark border-b border-white/5 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="text-neutral-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2 cursor-pointer" onClick={() => nextStep('material')}>
              <Box className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              <span className="font-display font-black text-xl sm:text-2xl tracking-tighter">CUSTOM<span className="text-cyan-400">CAPS</span></span>
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-4 items-center">
             <button onClick={() => setIsBasketOpen(true)} className="flex items-center gap-2 bg-white/5 px-3 sm:px-4 py-2 rounded-xl text-neutral-400 hover:text-white transition-all text-xs sm:text-sm font-bold">
               <ShoppingBag className="w-4 h-4" />
               <span className="hidden sm:inline">₹{basket.reduce((sum, item) => sum + item.price, 0)}</span>
               <span className="bg-black/50 px-2 py-0.5 rounded-full text-[10px] sm:text-xs">({basket.length})</span>
            </button>
            {user && (
                <button onClick={() => { signOut(auth); setIsGuest(false); }} className="text-[10px] sm:text-xs font-bold text-neutral-500 hover:text-red-400 transition-colors bg-white/5 px-3 py-2 rounded-xl">
                  Logout
                </button>
            )}
            <div className="hidden lg:flex gap-1 text-[10px] font-bold tracking-widest uppercase text-neutral-500 ml-8">
              {['material', 'occasion', 'design', 'review'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className={`${currentStep === s ? 'text-cyan-400' : 'text-neutral-500'}`}>{s}</span>
                  {i < 3 && <ChevronRight className="w-3 h-3" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {currentStep === 'material' && (
            <motion.section 
              key="material"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col flex-1"
            >
              <div className="text-center mb-16">
                <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-4 uppercase italic">01. Pick Your Base</h1>
                <p className="text-neutral-400 text-lg">Choose the material that defines your performance.</p>
              </div>

              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } }
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
              >
                {MATERIALS.map((mat) => (
                  <motion.button
                    key={mat.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelection({ ...selection, material: mat })}
                    className={`p-8 rounded-[40px] text-left transition-all relative overflow-hidden group ${
                      selection.material.id === mat.id 
                      ? 'bg-white/10 ring-2 ring-cyan-400 border-transparent shadow-2xl shadow-cyan-500/10' 
                      : 'bg-white/5 border border-white/5 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="mb-8 w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {mat.icon}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-2xl font-black mb-2">{mat.name}</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed max-w-[150px]">{mat.desc}</p>
                      </div>
                      <span className="text-lg font-black text-white/40">₹{mat.price}</span>
                    </div>
                    {selection.material.id === mat.id && (
                      <div className="absolute top-4 right-4 text-cyan-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </motion.div>

              <div className="mt-auto flex justify-center">
                <button 
                  onClick={() => nextStep('occasion')}
                  className="bg-cyan-500 hover:bg-cyan-400 text-white px-12 py-5 rounded-3xl font-black text-xl flex items-center gap-3 transition-all shadow-xl shadow-cyan-500/20 group uppercase italic"
                >
                  Choose Theme <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.section>
          )}

          {currentStep === 'occasion' && (
            <motion.section 
              key="occasion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col flex-1"
            >
              <div className="text-center mb-16">
                <button onClick={() => prevStep('material')} className="mb-8 inline-flex items-center gap-2 text-neutral-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
                <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-4 uppercase italic">02. The Occasion</h1>
                <p className="text-neutral-400 text-lg">Define the moment you are creating for.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto w-full">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() => setSelection({ ...selection, occasion: occ, customText: occ.defaultText, bottleColor: occ.defaultColor })}
                    className={`p-10 rounded-[48px] text-left transition-all ${
                      selection.occasion.id === occ.id 
                      ? 'bg-neutral-900 ring-2 ring-purple-500/50' 
                      : 'bg-white/5 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="w-10 h-10 mb-6 bg-white/5 rounded-full flex items-center justify-center text-purple-400">
                      <span className="text-xl">{occ.symbol}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-2 uppercase italic">{occ.name}</h3>
                    <p className="text-sm text-neutral-500">{occ.desc}</p>
                    {selection.occasion.id === occ.id && (
                      <div className="mt-8 flex items-center gap-2 text-purple-400 font-black text-xs tracking-widest uppercase">
                        <Check className="w-4 h-4" /> Selected Theme
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-auto flex justify-center">
                <button 
                  onClick={() => nextStep('design')}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-12 py-5 rounded-3xl font-black text-xl flex items-center gap-3 transition-all shadow-xl shadow-purple-500/20 group uppercase italic"
                >
                  Start Lab <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.section>
          )}

          {currentStep === 'design' && (
            <motion.section 
              key="design"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col lg:flex-row gap-12 flex-1 items-stretch"
            >
              {/* Left Controls */}
              <div className="w-full lg:w-1/3 flex flex-col gap-8 pb-12">
                <button onClick={() => prevStep('occasion')} className="inline-flex items-center gap-2 text-neutral-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors self-start">
                  <ChevronLeft className="w-4 h-4" /> Themes
                </button>
                
                <div>
                  <h2 className="text-4xl font-black mb-8 uppercase italic leading-none">03. The Lab</h2>
                  <div className="space-y-10">
                    {/* Colors */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-black text-neutral-400 uppercase tracking-widest">
                          <Palette className="w-4 h-4" /> Bottle Color
                        </div>
                        <motion.div 
                          className="flex flex-wrap gap-3"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                          }}
                        >
                          {COLORS.map((c) => (
                            <motion.button
                              key={c}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelection({ ...selection, bottleColor: c })}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${selection.bottleColor === c ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-400/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </motion.div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-black text-neutral-400 uppercase tracking-widest">
                          <Palette className="w-4 h-4" /> Cap Color
                        </div>
                        <motion.div 
                          className="flex flex-wrap gap-3"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                          }}
                        >
                          {COLORS.map((c) => (
                            <motion.button
                              key={c}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelection({ ...selection, capColor: c })}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${selection.capColor === c ? 'border-purple-400 scale-110 shadow-lg shadow-purple-400/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </motion.div>
                      </div>
                    </div>

                    {/* Shape Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-black text-neutral-400 uppercase tracking-widest">
                        <Layers className="w-4 h-4" /> Bottle Shape
                      </div>
                      <div className="flex gap-2">
                        {SHAPES.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelection({ ...selection, shape: s.id })}
                            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selection.shape === s.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-neutral-500 hover:text-white'}`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-black text-neutral-400 uppercase tracking-widest">
                        <Box className="w-4 h-4" /> Bottle Size
                      </div>
                      <div className="flex gap-2">
                        {SIZES.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelection({ ...selection, size: s.id })}
                            className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selection.size === s.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-neutral-500 hover:text-white'}`}
                          >
                            {s.name} {s.priceAdd > 0 ? `(+₹${s.priceAdd})` : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Customization & Color */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm font-black text-neutral-400 uppercase tracking-widest">
                          <Type className="w-4 h-4" /> Message Output
                        </div>
                        <select 
                           value={selection.textFont}
                           onChange={e => setSelection({...selection, textFont: e.target.value})}
                           className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
                        >
                           <option value="Inter">Inter</option>
                           <option value="Georgia">Georgia</option>
                           <option value="Courier New">Courier</option>
                           <option value="Impact">Impact</option>
                           <option value="Arial Black">Arial Black</option>
                        </select>
                      </div>
                      
                      <input 
                        type="text" 
                        value={selection.customText}
                        onChange={(e) => setSelection({ ...selection, customText: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-bold focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all font-display"
                        placeholder="Enter your message..."
                      />
                      
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-neutral-500 uppercase flex justify-between">
                            <span>Text Scale</span>
                            <span>{Math.round(selection.textScale * 100)}%</span>
                         </label>
                         <input 
                           type="range" min="0.5" max="3" step="0.1" 
                           value={selection.textScale}
                           onChange={e => setSelection({...selection, textScale: parseFloat(e.target.value)})}
                           className="w-full h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer" 
                         />
                      </div>
                      
                      <div className="pt-2 border-t border-white/10 uppercase tracking-widest text-[10px] font-black text-neutral-500 flex items-center justify-between">
                        <span className="flex-1">Tip: Enable 'Move Tool' to drag text directly on the bottle!</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelection({ ...selection, isMoveEnabled: !selection.isMoveEnabled })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-white transition-colors ${selection.isMoveEnabled ? 'bg-cyan-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                          >
                            <Eye className="w-3 h-3" />
                            {selection.isMoveEnabled ? 'Locked' : 'Move Tool'}
                          </button>
                          <button 
                            onClick={() => setSelection({ ...selection, textRotationZ: selection.textRotationZ === 0 ? Math.PI / 2 : 0 })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                          >
                            <RotateCw className="w-3 h-3" />
                            Rotate
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {COLORS.map((c) => (
                          <motion.button
                            key={c}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelection({ ...selection, textColor: c })}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${selection.textColor === c ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Logo Simulation */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-black text-neutral-400 uppercase tracking-widest">
                        <Upload className="w-4 h-4" /> Logo Surface
                      </div>
                      <label className="p-8 border-2 border-dashed border-white/10 rounded-3xl text-center hover:border-cyan-400/50 hover:bg-white/5 cursor-pointer transition-all block relative">
                        <input 
                          type="file" 
                          accept="image/png, image/svg+xml, image/jpeg" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                if (ev.target?.result) {
                                  // Process image to auto-remove white background and crop
                                  const processed = await processAndCropImage(ev.target.result as string);
                                  setSelection({ ...selection, logo: processed });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {selection.logo ? (
                           <div className="flex flex-col items-center gap-2">
                             <img src={selection.logo} alt="Logo Preview" className="w-16 h-16 object-contain mix-blend-multiply opacity-80" />
                             <span className="text-xs font-bold text-cyan-400 uppercase">Logo Processed & Uploaded</span>
                           </div>
                        ) : (
                           <>
                             <Upload className="w-8 h-8 mx-auto mb-3 text-neutral-500" />
                             <p className="text-xs font-bold text-neutral-400 uppercase tracking-tight">Drop Image (Auto-Remove White BG)</p>
                           </>
                        )}
                      </label>
                      {selection.logo && (
                        <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                           <div className="uppercase tracking-widest text-[10px] font-black text-neutral-500">
                             Tip: Drag logo directly on the bottle in the preview to move it! Pinch or use wheel to resize.
                           </div>
                           <button 
                             onClick={() => setSelection({ ...selection, logo: null, logoScale: 1, logoPosition: -0.6 })}
                             className="w-full py-2 mt-2 text-xs font-bold uppercase tracking-widest text-white bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-colors"
                           >
                             Clear Logo
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                    <button 
                    onClick={() => nextStep('review')}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-white py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-cyan-500/20 group uppercase italic"
                    >
                    Review Final <Eye className="w-6 h-6 group-hover:animate-pulse" />
                    </button>
                </div>
              </div>

              {/* Right: Realistic Preview */}
              <div className="flex-1 h-[600px] lg:min-h-[800px] bg-neutral-950 rounded-[64px] border border-white/10 relative overflow-hidden lg:sticky lg:top-32 shadow-2xl flex items-center justify-center">
                <Bottle3DPreview selection={selection} setSelection={setSelection} />

                <div className="absolute bottom-8 right-8 pointer-events-none">
                   <div className="text-[10px] text-white/20 font-black uppercase tracking-widest text-right">
                      Ultra High-Fidelity Rendering
                   </div>
                </div>
              </div>
            </motion.section>
          )}

          {currentStep === 'review' && (
            <motion.section 
              key="review"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto w-full"
            >
                <div className="text-center mb-16">
                    <button onClick={() => prevStep('design')} className="mb-8 inline-flex items-center gap-2 text-neutral-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Lab
                    </button>
                    <h1 className="font-display text-6xl font-black mb-4 uppercase italic">Final Review</h1>
                    <p className="text-neutral-500">Every detail has been precise. Ready to ship?</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center bg-neutral-900 overflow-hidden rounded-[48px] p-10 border border-white/5 mb-12">
                   <div className="h-[400px] flex items-center justify-center bg-black/50 rounded-[32px] overflow-hidden relative">
                      <Bottle3DPreview selection={selection} setSelection={setSelection} />
                   </div>

                   <div className="space-y-8">
                      <div>
                        <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">Specifications</h4>
                        <div className="space-y-4">
                           <SummaryItem label="Material" value={selection.material.name} />
                           <SummaryItem label="Theme" value={selection.occasion.name} />
                           <SummaryItem label="Customisation" value={selection.customText} />
                           <SummaryItem label="Production Time" value="2-3 Days" />
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/5">
                        <div className="flex justify-between items-end mb-8">
                           <span className="text-neutral-400 font-bold">Total Investment</span>
                           <span className="text-4xl font-black italic">₹{calculatePrice(selection)}</span>
                        </div>
                        <div className="flex gap-4">
                           <button 
                             onClick={() => {
                                 setBasket([...basket, { ...selection, price: calculatePrice(selection) }]);
                                 setIsBasketOpen(true);
                             }}
                             className="w-full bg-white text-black py-6 rounded-[32px] font-black text-2xl uppercase italic hover:bg-white/90 transition-all flex items-center justify-center gap-4"
                           >
                              Add to Basket
                           </button>
                        </div>
                      </div>
                   </div>
                </div>
            </motion.section>
          )}

          {currentStep === 'about' && (
             <AboutPage onBack={() => nextStep('material')} />
          )}

          {currentStep === 'admin' && (
             <AdminPanel />
          )}

          {currentStep === 'orders' && (
             <CustomerOrders userEmail={user?.email || ''} />
          )}

          {currentStep === 'profile' && user && (
             <UserProfile user={user} />
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer Branding */}
      <footer className="relative z-10 py-10 border-t border-white/5 text-center mt-auto flex flex-col items-center gap-4">
         <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em]">Proprietary Customisation Platform v4.0.0-PRO</p>
      </footer>
      <BasketPanel isOpen={isBasketOpen} onClose={() => setIsBasketOpen(false)} basket={basket} setBasket={setBasket} userEmail={user?.email || ''} onCheckoutComplete={handleCheckoutComplete} />
      
      <AnimatePresence>
        {showMockingPopup && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-[9999] bg-red-600 flex items-center justify-center p-4 flex-col"
          >
            <div className="absolute top-4 right-4 bg-black text-red-500 font-mono text-4xl p-4 font-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col items-center">
               <span className="text-xl leading-none mb-1 text-white">CLOSING IN</span>
               <span className="text-6xl">{mockingTimeLeft}s</span>
            </div>
            <div className="text-center w-full">
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-black uppercase tracking-tighter text-black bg-white inline-block p-10 transform -rotate-3 border-8 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
                DEKHA MOTE HMARI BOTTLE TO BIK GYI TERI SOLAR CAR KB BIKEGI
              </h1>
              <p className="mt-12 text-3xl font-black text-black bg-yellow-400 inline-block px-6 py-2 transform rotate-2 border-4 border-black">
                - Parth Mehta
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-[300px] sm:w-[400px] bg-neutral-950 border-r border-white/10 z-50 p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-16 shrink-0">
                <div className="flex items-center gap-2">
                  <Box className="w-8 h-8 text-cyan-400" />
                  <span className="font-display font-black text-2xl tracking-tighter uppercase italic">CUSTOM<span className="text-cyan-400">CAPS</span></span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col gap-8 font-display font-black text-3xl sm:text-4xl italic uppercase tracking-tighter">
                  <button onClick={() => { setIsSidebarOpen(false); nextStep('material'); }} className="text-left py-2 hover:text-cyan-400 transition-colors text-white">Home</button>
                  <button onClick={() => { setIsSidebarOpen(false); nextStep('profile'); }} className="text-left py-2 hover:text-cyan-400 transition-colors text-white">Profile</button>
                  <button onClick={() => { setIsSidebarOpen(false); nextStep('orders'); }} className="text-left py-2 hover:text-cyan-400 transition-colors text-white">My Orders</button>
                  <button onClick={() => { setIsSidebarOpen(false); nextStep('about'); }} className="text-left py-2 hover:text-cyan-400 transition-colors text-white">About Us</button>
                  {['loveranger900@gmail.com', 'adarshray142@gmail.com', 'scam7737@gmail.com'].includes(user?.email || '') && (
                      <button onClick={() => { setIsSidebarOpen(false); nextStep('admin'); }} className="text-left py-2 hover:text-cyan-400 transition-colors text-white">Admin Panel</button>
                  )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerOrders({ userEmail }: { userEmail: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null);

  useEffect(() => {
    if (!userEmail) return;
    try {
        const q = query(collection(db, 'orders'), where('customerEmail', '==', userEmail));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(fetchedOrders);
        });
        return () => unsubscribe();
    } catch (error) {
        console.error("Firestore Error: ", error);
    }
  }, [userEmail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'in production': return 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20';
      case 'in delivery': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'delivered': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
    }
  };

  return (
    <motion.section 
      key="orders"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full text-white"
    >
      <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-8">
        <h1 className="text-5xl font-black uppercase italic tracking-tight">Your Orders</h1>
      </div>

      <div className="space-y-6">
        {orders.map(order => (
            <div key={order.id} className="bg-neutral-900 border border-white/10 rounded-3xl p-8 flex flex-col hover:border-white/20 transition-all">
              <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 font-black text-xl uppercase tracking-widest text-neutral-300">
                    Order <span className="text-cyan-400">#{order.id.slice(0, 6)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 font-mono text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className={`px-4 py-2 border rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(order.status)}`}>
                  {order.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : order.status === 'in delivery' ? <Truck className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                  {order.status}
                </div>
              </div>

              <div className="flex-1">
                <div className="space-y-4 mb-6">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-black/40 rounded-2xl p-4">
                      <div>
                        <div className="font-black text-lg flex items-center gap-2">
                           <span className="text-cyan-400">{item.quantity}x</span>
                           {item.material?.name || 'Custom Bottle'} <span className="text-neutral-500 text-sm">({item.size || '500ml'})</span>
                        </div>
                        <div className="text-sm text-neutral-400 mt-1 uppercase font-bold tracking-widest flex gap-2">
                           <span>{item.customText || 'NO TEXT'}</span>
                           <span className="text-neutral-600">•</span>
                           <span>{item.bottleColor}</span>
                        </div>
                      </div>
                      <div className="font-mono text-lg font-bold flex flex-col items-end gap-2">
                        <span>₹{item.totalPrice}</span>
                        <button onClick={() => setPreviewItem(item)} className="px-3 py-1 bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                          <Eye className="w-3 h-3" /> View Design
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center mt-auto">
                <span className="font-black uppercase tracking-widest text-neutral-500">Order Total</span>
                <span className="text-3xl font-black italic">₹{order.total}</span>
              </div>
            </div>
        ))}

        {orders.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
            <Package className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest">No order history found.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            <button onClick={() => setPreviewItem(null)} className="absolute top-4 sm:top-8 right-4 sm:right-8 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2 mt-16 sm:mt-0">
              <X className="w-6 h-6" /> <span className="font-bold uppercase tracking-widest text-xs hidden sm:inline">Close</span>
            </button>
            
            <div className="h-[60vh] w-full max-w-lg relative bg-transparent rounded-3xl overflow-hidden cursor-move">
              <Bottle3DPreview selection={previewItem} setSelection={() => {}} />
            </div>
            
            <div className="mt-8 text-center bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">{previewItem.material?.name || 'Custom Bottle'}</h3>
              <div className="flex flex-wrap items-center justify-center gap-3 text-neutral-400 mt-2 uppercase font-bold tracking-widest text-xs sm:text-sm">
                 <span className="bg-black/40 px-3 py-1 rounded-full text-cyan-400">Text: {previewItem.customText || 'NO TEXT'}</span>
                 <span className="bg-black/40 px-3 py-1 rounded-full">{previewItem.size || '500ml'}</span>
                 <span className="bg-black/40 px-3 py-1 rounded-full">{previewItem.shape || 'Standard'} Shape</span>
              </div>
              <p className="text-neutral-500 text-[10px] uppercase font-black tracking-[0.2em] mt-6">Drag to rotate • Scroll to zoom</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function SummaryItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-neutral-500 font-bold uppercase">{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}

function AuthScreen({ onGuest }: { onGuest: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem('sips_preview_email') || ''; } catch { return ''; }
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const tryAutoLogin = async () => {
      // Wait for Firebase to attempt session restoration
      await new Promise(resolve => setTimeout(resolve, 500));
      if (auth.currentUser) return; 

      try {
        const storedEmail = localStorage.getItem('sips_preview_email');
        const storedPass = localStorage.getItem('sips_preview_pass');
        if (storedEmail && storedPass) {
           setLoading(true);
           await signInWithEmailAndPassword(auth, storedEmail, atob(storedPass));
           setLoading(false);
        }
      } catch (err) {
        setLoading(false);
        console.error('Auto-login failed', err);
        // Clear broken credentials
        try { 
          localStorage.removeItem('sips_preview_email'); 
          localStorage.removeItem('sips_preview_pass'); 
        } catch {}
      }
    };
    tryAutoLogin();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password Auth is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please switch to login.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#030014] text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none z-0 fixed">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 bg-white/5 border border-white/10 p-6 sm:p-10 rounded-3xl sm:rounded-[48px] backdrop-blur-xl my-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-10">
          <Box className="w-8 h-8 text-cyan-400" />
          <span className="font-display font-black text-3xl tracking-tighter uppercase italic">CUSTOM<span className="text-cyan-400">CAPS</span></span>
        </div>

        <h2 className="text-2xl font-black uppercase text-center mb-2 tracking-tight">
          {isLogin ? 'Access Lab' : 'Request Access'}
        </h2>
        <p className="text-neutral-500 text-center text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 sm:mb-8">
          {isLogin ? 'Enter credentials to continue' : 'Create an account to begin'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider p-4 rounded-2xl mb-6 text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 sm:space-y-6">
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="email" 
              placeholder="EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold uppercase placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-all text-white"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="password" 
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold uppercase placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-all text-white"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 uppercase italic"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-black/50" /> : (isLogin ? 'Initialize Session' : 'Create Account')}
          </button>
          
          <button 
            type="button"
            onClick={onGuest}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
          >
            Continue as Guest
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-cyan-400 transition-colors"
          >
            {isLogin ? "Don't have access? Apply here." : "Already have access? Log in."}
          </button>
          {isLogin && (
            <div className="mt-4">
              <button 
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError('Please enter your email address first.');
                    return;
                  }
                  
                  // Simple rate limiting in UI
                  const lastReset = localStorage.getItem('last_password_reset');
                  if (lastReset && Date.now() - parseInt(lastReset) < 60000) {
                      setError('Please wait 1 minute before requesting another reset email.');
                      return;
                  }

                  try {
                    await sendPasswordResetEmail(auth, email);
                    localStorage.setItem('last_password_reset', Date.now().toString());
                    alert('Password reset email sent. Please check your inbox.');
                  } catch (err: any) {
                    // Provide clearer instructions for common auth failures
                    if (err.code === 'auth/user-not-found') {
                       setError('No account found with this email.');
                    } else if (err.code === 'auth/too-many-requests') {
                       setError('Too many requests. Please try again later.');
                    } else {
                       setError(err.message || 'Failed to send reset email.');
                    }
                  }
                }}
                className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-cyan-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


