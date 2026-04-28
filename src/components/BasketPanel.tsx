import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Trash2, CreditCard } from 'lucide-react';

export function BasketPanel({ isOpen, onClose, basket, setBasket, nextStep }: any) {
  const total = basket.reduce((sum: number, item: any) => sum + item.price, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-neutral-950 border-l border-white/10 z-50 p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <ShoppingBag className="text-cyan-400 w-8 h-8" /> Basket
              </h2>
              <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {basket.length === 0 ? (
                <div className="text-neutral-500 text-center py-20 font-bold uppercase tracking-widest text-sm">Basket is empty</div>
              ) : (
                basket.map((item: any, index: number) => (
                  <div key={index} className="bg-neutral-900 p-6 rounded-3xl flex justify-between items-center border border-white/5">
                    <div>
                      <h4 className="font-black text-xl">{item.material.name}</h4>
                      <p className="text-xs text-neutral-400 mt-1 uppercase font-bold tracking-widest">{item.customText}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-2xl">₹{item.price}</span>
                      <button onClick={() => setBasket(basket.filter((_: any, i: number) => i !== index))} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {basket.length > 0 && (
              <div className="pt-8 border-t border-white/10 mt-6">
                <div className="flex justify-between items-center mb-8">
                   <span className="text-neutral-400 font-black uppercase tracking-widest">Total</span>
                   <span className="text-5xl font-black italic">₹{total}</span>
                </div>
                <button 
                  onClick={() => { onClose(); nextStep('checkout'); }}
                  className="w-full bg-cyan-500 py-6 rounded-[32px] font-black text-2xl uppercase italic hover:bg-cyan-400 transition-colors flex items-center justify-center gap-4"
                >
                  Checkout <CreditCard className="w-6 h-6" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
