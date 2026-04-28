import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';

export function AdminPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ name: '', price: 0 });

  const fetchData = () => {
    try {
        getDocs(collection(db, 'items')).then(itemsSnapshot => {
            setItems(itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        
        const q = collection(db, 'orders');
        return onSnapshot(q, (snapshot) => {
            console.log("Fetched orders:", snapshot.size);
            setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
    } catch (error) {
        console.error("Firestore Error: ", error);
    }
  };

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handleAddItem = async () => {
    await addDoc(collection(db, 'items'), newItem);
    fetchData();
    setNewItem({ name: '', price: 0 });
  };

  const handleUpdatePrice = async (id: string, price: number) => {
    await updateDoc(doc(db, 'items', id), { price });
    fetchData();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-white">
      <h1 className="text-4xl font-black mb-8">Admin Panel</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Manage Items</h2>
        <div className="flex gap-4 mb-4">
            <input placeholder="Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="bg-neutral-800 p-2 rounded" />
            <input type="number" placeholder="Price" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} className="bg-neutral-800 p-2 rounded" />
            <button onClick={handleAddItem} className="bg-cyan-500 px-4 py-2 rounded">Add Item</button>
        </div>
        <ul>
          {items.map(item => (
            <li key={item.id} className="flex gap-4 items-center mb-2">
              {item.name} - ₹{item.price}
              <button onClick={() => handleUpdatePrice(item.id, item.price + 10)} className="bg-neutral-700 px-2 rounded">+</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Orders</h2>
        <ul>
          {orders.map(order => (
            <li key={order.id} className="bg-neutral-800 p-4 mb-2 rounded">
              Order {order.id}: {order.customerEmail} - ₹{order.total} - {order.status}
            </li>
          ))}
        </ul>
      </section>
    </motion.div>
  );
}
