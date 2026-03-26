import { useState, useEffect } from 'react';
import api from '../services/api';
import { Image as ImageIcon, Store, ExternalLink, Power, PowerOff, Upload, Save } from 'lucide-react';

const SLOTS = ['P1', 'P2', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'];

const Posters = () => {
    const [posters, setPosters] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSlot, setEditingSlot] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        store_id: '',
        status: 'active',
        image: null as File | null,
        previewUrl: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pRes, sRes] = await Promise.all([
                api.get('/market/posters'),
                api.get('/market/stores')
            ]);
            setPosters(pRes.data.posters || []);
            setStores(sRes.data.stores || []);
        } catch (error) {
            console.error('Failed to fetch posters/stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (slotId: string) => {
        const poster = posters.find(p => p.id === slotId);
        setEditingSlot(slotId);
        setFormData({
            store_id: poster?.store_id || '',
            status: poster?.status || 'active',
            image: null,
            previewUrl: poster?.image_url || ''
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({
                ...formData,
                image: file,
                previewUrl: URL.createObjectURL(file)
            });
        }
    };

    const handleSave = async () => {
        if (!editingSlot) return;

        const data = new FormData();
        data.append('store_id', formData.store_id);
        data.append('status', formData.status);
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            setLoading(true);
            const res = await api.post(`/market/posters/${editingSlot}`, data);
            if (res.data.success) {
                await fetchData();
                setEditingSlot(null);
            }
        } catch (error) {
            console.error('Failed to save poster:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPosterForSlot = (slot: string) => posters.find(p => p.id === slot);

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Poster Management</h2>
                    <p className="text-gray-400">Configure marketplace posters and their destinations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SLOTS.map(slot => {
                    const poster = getPosterForSlot(slot);
                    const store = stores.find(s => s.id === poster?.store_id);
                    const isEditing = editingSlot === slot;

                    return (
                        <div key={slot} className={`glass p-6 rounded-3xl border ${isEditing ? 'border-primary shadow-lg shadow-primary/10' : 'border-white/5'} transition-all`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className={`px-3 py-1 rounded-lg text-xs font-black ${slot.startsWith('P') ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {slot}
                                </span>
                                {poster?.status === 'active' ? (
                                    <Power className="w-4 h-4 text-green-500" />
                                ) : (
                                    <PowerOff className="w-4 h-4 text-gray-500" />
                                )}
                            </div>

                            <div className="aspect-[16/9] bg-white/5 rounded-2xl overflow-hidden mb-4 relative group">
                                {(isEditing ? formData.previewUrl : poster?.image_url) ? (
                                    <img 
                                        src={isEditing ? formData.previewUrl : (poster.image_url.startsWith('http') ? poster.image_url : `${api.defaults.baseURL?.replace('/admin', '')}${poster.image_url}`)} 
                                        className="w-full h-full object-contain bg-white/5" 
                                        alt={slot}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                        <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Image</span>
                                    </div>
                                )}
                                
                                {isEditing && (
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white mb-2" />
                                        <span className="text-white text-xs font-bold">CHANGE PHOTO</span>
                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                    </label>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase mb-1 block">Linked Store</label>
                                        <select 
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-text focus:border-primary outline-none transition-all"
                                            value={formData.store_id}
                                            onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                                        >
                                            <option value="">Select a store...</option>
                                            {stores.map(s => (
                                                <option key={s.id} value={s.id}>{s.store_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="flex-1 bg-primary text-black font-black py-2 rounded-xl text-xs hover:scale-105 transition-all flex items-center justify-center space-x-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>SAVE</span>
                                        </button>
                                        <button 
                                            onClick={() => setEditingSlot(null)}
                                            className="px-4 bg-white/5 text-gray-400 font-bold py-2 rounded-xl text-xs hover:bg-white/10 transition-all underline"
                                        >
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase">Destination</p>
                                        <p className="text-sm font-bold truncate flex items-center space-x-2">
                                            {store ? (
                                                <>
                                                    <Store className="w-3 h-3 text-primary" />
                                                    <span>{store.store_name}</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-600">UNASSIGNED</span>
                                            )}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleEdit(slot)}
                                        className="w-full bg-white/5 border border-white/10 text-text font-bold py-2 rounded-xl text-xs hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        <span>EDIT SLOT</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Posters;
