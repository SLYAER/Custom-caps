import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Trash2, CreditCard, Plus, Minus, CheckCircle2, Check, Mail } from 'lucide-react';
import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export function BasketPanel({ isOpen, onClose, basket, setBasket, userEmail, onCheckoutComplete }: any) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [email, setEmail] = useState(userEmail || '');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  // Group basket items by a unique identifier (e.g., combining ID + customText)
  const groupedBasket = basket.reduce((acc: any[], item: any) => {
    const existing = acc.find(i => i.material.id === item.material.id && i.customText === item.customText);
    if (existing) {
      existing.quantity += 1;
      existing.totalPrice += item.price;
    } else {
      acc.push({ ...item, quantity: 1, totalPrice: item.price });
    }
    return acc;
  }, []);

  const total = groupedBasket.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

  const updateQuantity = (item: any, delta: number) => {
    if (delta > 0) {
      setBasket([...basket, item]);
    } else {
      // Remove one instance of this item type
      const index = basket.findIndex(i => i.material.id === item.material.id && i.customText === item.customText);
      if (index > -1) {
        const newBasket = [...basket];
        newBasket.splice(index, 1);
        setBasket(newBasket);
      }
    }
  };

  const removeItem = (item: any) => {
    setBasket(basket.filter(i => !(i.material.id === item.material.id && i.customText === item.customText)));
  };

  async function handleOrderConfirmation(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (basket.length > 0) {
      try {
        const cleanItems = basket.map(item => {
          const cleaned = { ...item };
          if (cleaned.material) {
            cleaned.material = { ...cleaned.material };
            delete cleaned.material.icon;
          }
          return cleaned;
        });

        await addDoc(collection(db, 'orders'), {
            customerEmail: email, // Use the email from state
            items: cleanItems,
            total,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        setBasket([]);
        setIsSubscribed(true);
        if (onCheckoutComplete) {
            onCheckoutComplete();
        }
      } catch (error: any) {
        console.error("Error saving order:", error);
        setError('Failed to confirm order: ' + error.message);
      }
    } else {
        setError('Basket is empty.');
    }
  }

  const handleClose = () => {
      setIsCheckingOut(false);
      setIsSubscribed(false);
      onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-neutral-950 border-l border-white/10 z-50 p-8 flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-10 shrink-0">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <ShoppingBag className="text-cyan-400 w-8 h-8" /> Basket
              </h2>
              <button onClick={handleClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!isCheckingOut ? (
              <>
                <div className="flex-1 space-y-6">
                  {groupedBasket.length === 0 ? (
                    <div className="text-neutral-500 text-center py-20 font-bold uppercase tracking-widest text-sm">Basket is empty</div>
                  ) : (
                    groupedBasket.map((item: any, index: number) => (
                      <div key={index} className="bg-neutral-900 p-6 rounded-3xl flex justify-between items-center border border-white/5">
                        <div>
                          <h4 className="font-black text-xl">{item.material.name} <span className="text-neutral-500 text-sm">({item.size || '500ml'})</span></h4>
                          <p className="text-xs text-neutral-400 mt-1 uppercase font-bold tracking-widest">{item.customText}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 bg-black/50 rounded-full p-1">
                            <button onClick={() => updateQuantity(item, -1)} className="p-1 hover:text-cyan-400"><Minus className="w-4 h-4" /></button>
                            <span className="font-black w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item, 1)} className="p-1 hover:text-cyan-400"><Plus className="w-4 h-4" /></button>
                          </div>
                          <span className="font-black text-2xl w-24 text-right">₹{item.totalPrice}</span>
                          <button onClick={() => removeItem(item)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {groupedBasket.length > 0 && (
                  <div className="pt-8 border-t border-white/10 mt-6 shrink-0">
                    <div className="flex justify-between items-center mb-8">
                       <span className="text-neutral-400 font-black uppercase tracking-widest">Total</span>
                       <span className="text-5xl font-black italic">₹{total}</span>
                    </div>
                    <button 
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full bg-cyan-500 py-6 rounded-[32px] font-black text-2xl uppercase italic hover:bg-cyan-400 transition-colors flex items-center justify-center gap-4 text-black"
                    >
                      Checkout <CreditCard className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </>
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    {error && <div className="p-4 mb-4 text-red-500 bg-red-500/10 rounded-xl w-full">{error}</div>}
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/50 relative">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                        {isSubscribed && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-1 -bottom-1 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center border-4 border-[#030014]"
                          >
                            <Check className="w-4 h-4 text-black" />
                          </motion.div>
                        )}
                    </div>
                    <h1 className="font-display text-4xl font-black mb-4 uppercase italic">
                        {isSubscribed ? "Order Confirmed!" : "Unit Reserved!"}
                    </h1>
                    <p className="text-neutral-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                        {isSubscribed ? "We have logged your order. We will send tracking updates to your inbox." : "Your custom project has been logged in our lab. Where should we send production tracking updates?"}
                    </p>

                    {!isSubscribed ? (
                      <div className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl mb-8 shadow-2xl">
                          <div className="flex items-center gap-3 mb-4 text-left">
                            <Mail className="w-5 h-5 text-cyan-400" />
                            <span className="font-bold text-sm uppercase tracking-widest text-neutral-300">Tracking Email</span>
                          </div>
                          <form onSubmit={handleOrderConfirmation} className="flex flex-col gap-4">
                            <input 
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="EMAIL ADDRESS"
                              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 focus:bg-white/5 transition-all outline-none"
                              required
                            />
                            <button 
                              type="submit"
                              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                            >
                              Confirm Order
                            </button>
                          </form>
                      </div>
                    ) : (
                        <button 
                          onClick={handleClose}
                          className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all"
                        >
                          Continue Shopping
                        </button>
                    )}
                </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
