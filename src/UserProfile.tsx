import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Mail, Camera, Edit2, Check, X, Loader2 } from 'lucide-react';

export function UserProfile({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    address: '',
    photoURL: ''
  });

  const [editForm, setEditForm] = useState({ ...profile });

  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            name: data.name || '',
            phone: data.phone || '',
            address: data.address || '',
            photoURL: data.photoURL || ''
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleEdit = () => {
    setEditForm(profile);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const finalForm = { ...editForm };
      if (finalForm.name.toUpperCase() === 'MOHIT') {
        finalForm.name = 'SOLAR BATTERY';
      }
      await setDoc(doc(db, 'users', user.uid), finalForm, { merge: true });
      setProfile(finalForm);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditForm({ ...editForm, photoURL: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto pt-24 px-4 sm:px-6 mb-20"
    >
      <div className="bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="h-32 bg-gradient-to-r from-cyan-900/40 to-blue-900/40" />
        
        <div className="px-8 pb-8 relative">
          <div className="relative -mt-16 mb-6 flex justify-between items-end">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-neutral-900 bg-neutral-800 flex items-center justify-center overflow-hidden">
                {(isEditing ? editForm.photoURL : profile.photoURL) ? (
                  <img src={isEditing ? editForm.photoURL : profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-neutral-500" />
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            
            {!isEditing ? (
              <button onClick={handleEdit} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm font-bold uppercase tracking-widest border border-white/5">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm font-bold uppercase tracking-widest border border-white/5">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors text-sm font-black uppercase tracking-widest disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="text-xl font-bold text-white relative">
                  {profile.name || <span className="text-neutral-600 italic font-normal">Not set</span>}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <div className="text-white bg-black/30 rounded-xl px-4 py-3 border border-white/5 opacity-70">
                {user.email} <span className="text-[10px] ml-2 text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Verified</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" /> Phone Number
              </label>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  placeholder="e.g. +1 234 567 8900"
                />
              ) : (
                <div className="text-white">
                  {profile.phone || <span className="text-neutral-600 italic">Not set</span>}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" /> Delivery Address
              </label>
              {isEditing ? (
                <textarea 
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none h-24"
                  placeholder="Enter your full delivery address"
                />
              ) : (
                <div className="text-white whitespace-pre-wrap">
                  {profile.address || <span className="text-neutral-600 italic">Not set</span>}
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="pt-4 mt-8 border-t border-white/5 flex justify-end">
                 <button 
                   onClick={() => {
                     setEditForm({ name: '', phone: '', address: '', photoURL: '' });
                   }}
                   className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1"
                 >
                   <X className="w-3 h-3" /> Clear All Details
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
