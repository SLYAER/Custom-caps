import { motion } from 'framer-motion';
import { Mail, ChevronLeft } from 'lucide-react';

export function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl mx-auto w-full py-20 px-6"
    >
      <button onClick={onBack} className="mb-12 inline-flex items-center gap-2 text-neutral-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">
        <ChevronLeft className="w-4 h-4" /> Go Back
      </button>

      <div className="glass-dark border border-white/10 rounded-[64px] p-12 text-center text-white">
        <h1 className="font-display text-6xl font-black mb-12 uppercase italic text-cyan-400">About Us</h1>
        
        <div className="space-y-12">
            <div className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-widest">Owners</h2>
                <div className="text-4xl font-black tracking-tighter italic text-white/90">
                    ADARSH & PARTH
                </div>
                <div className="flex items-center justify-center gap-3 text-neutral-400 font-bold">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <a href="mailto:adarshray142@gmail.com" className="hover:text-cyan-400 transition-colors">adarshray142@gmail.com</a>
                </div>
            </div>

            <div className="pt-12 border-t border-white/10 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-widest text-neutral-500">Slaves</h3>
                <div className="text-2xl font-black tracking-tight text-white/70 italic">
                    Ashish, Rahul
                </div>
            </div>
        </div>
      </div>
    </motion.section>
  );
}
