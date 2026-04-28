import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, updateDoc, doc, onSnapshot, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, DollarSign, CircleUser, ChevronDown, CheckCircle2, Truck, Eye, X, Zap } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Bottle3DPreview } from './Bottle3D';

const STATUS_OPTIONS = ['pending', 'in production', 'in delivery', 'delivered'];

export function AdminPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [previewItem, setPreviewItem] = useState<any>(null);

  useEffect(() => {
    try {
        const q = collection(db, 'orders');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Fetched orders:", snapshot.size);
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // sort by createdAt descending
            fetchedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(fetchedOrders);
        });
        return () => unsubscribe();
    } catch (error) {
        console.error("Firestore Error: ", error);
    }
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      console.error("Failed to update order status", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'in production': return 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20';
      case 'in delivery': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'delivered': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
    }
  };

  const seedDummyOrders = async () => {
    const isConfirmed = window.confirm('This will add 45 dummy orders. Proceed?');
    if (!isConfirmed) return;
    
    const dummyNames = ['Alex', 'Jordan', 'Taylor', 'Sam', 'Casey', 'Riley', 'Morgan', 'Quinn'];
    const dummyDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const dummyStatuses = ['pending', 'in production', 'in delivery', 'delivered'];
    const dummyColors = ['Electric Cyan', 'Neon Pink', 'Matte Black', 'Brushed Steel'];
    const dummySizes = ['500ml', '750ml', '1000ml'];
    
    for (let i = 0; i < 45; i++) {
        const randomName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
        const randomDomain = dummyDomains[Math.floor(Math.random() * dummyDomains.length)];
        const randomStatus = dummyStatuses[Math.floor(Math.random() * dummyStatuses.length)];
        const randomColor = dummyColors[Math.floor(Math.random() * dummyColors.length)];
        const randomSize = dummySizes[Math.floor(Math.random() * dummySizes.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const pricePerUnit = Math.floor(Math.random() * 1000) + 500;
        
        const randomPastDate = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
        
        try {
            await addDoc(collection(db, 'orders'), {
                customerEmail: `${randomName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${randomDomain}`,
                createdAt: randomPastDate.toISOString(),
                status: randomStatus,
                items: [{
                    quantity: quantity,
                    customText: `SIPS-${Math.floor(Math.random() * 9999)}`,
                    bottleColor: randomColor,
                    size: randomSize,
                    shape: 'Standard',
                    totalPrice: pricePerUnit * quantity,
                    material: {
                         name: 'Titanium'
                    }
                }],
                total: pricePerUnit * quantity
            });
        } catch(e) {
            console.error('Failed dummy add', e);
        }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-7xl mx-auto text-white min-h-screen">
      <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-8">
        <h1 className="text-5xl font-black uppercase italic tracking-tight">System Control</h1>
      </div>
      
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-display font-black flex items-center gap-3">
            <Package className="text-cyan-400 w-8 h-8" />
            Active Orders ({orders.length})
          </h2>
          <button 
             onClick={seedDummyOrders}
             className="px-4 py-2 border border-dashed border-white/20 hover:bg-white/5 text-neutral-400 font-mono text-xs uppercase tracking-widest rounded-xl transition-colors"
          >
             Seed 45 Orders
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-neutral-900 border border-white/10 rounded-3xl p-8 flex flex-col hover:border-white/20 transition-all">
              <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CircleUser className="w-5 h-5 text-neutral-400" />
                    <span className="font-bold text-lg">{order.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 font-mono text-sm">
                    <Clock className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <div className={`px-4 py-2 border rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${getStatusColor(order.status)}`}>
                    {order.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : order.status === 'in delivery' ? <Truck className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                    {order.status}
                  </div>
                  
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 transition-all outline-none cursor-pointer hover:bg-white/5 appearance-none"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-neutral-900 text-white">{opt.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Line Items</h4>
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
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
              <Package className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-500 font-bold uppercase tracking-widest">No active orders found.</p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {previewItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            <button onClick={() => setPreviewItem(null)} className="absolute top-4 sm:top-8 right-4 sm:right-8 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2">
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
    </motion.div>
  );
}

