import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Package, Clock, DollarSign, CircleUser, ChevronDown, CheckCircle2, Truck } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'in production', 'in delivery', 'delivered'];

export function AdminPanel() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    try {
        const q = collection(db, 'orders');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("Fetched orders:", snapshot.size);
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // sort by createdAt descending
            fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
                      <div className="font-mono text-lg font-bold">
                        ₹{item.totalPrice}
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
    </motion.div>
  );
}

