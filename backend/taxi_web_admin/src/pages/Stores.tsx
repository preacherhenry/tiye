import { useState, useEffect } from 'react';
import api from '../services/api';
import { Store, Plus, Search, Edit2, Archive, Upload, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const Stores = () => {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<any>(null);
    const [formData, setFormData] = useState({
        store_name: '',
        store_description: '',
        logo: null as File | null,
        previewUrl: ''
    });

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const res = await api.get('/market/stores');
            setStores(res.data.stores || []);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (store: any = null) => {
        if (store) {
            setEditingStore(store);
            setFormData({
                store_name: store.store_name,
                store_description: store.store_description,
                logo: null,
                previewUrl: store.store_logo || ''
            });
        } else {
            setEditingStore(null);
            setFormData({
                store_name: '',
                store_description: '',
                logo: null,
                previewUrl: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({
                ...formData,
                logo: file,
                previewUrl: URL.createObjectURL(file)
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        data.append('store_name', formData.store_name);
        data.append('store_description', formData.store_description);
        if (formData.logo) {
            data.append('logo', formData.logo);
        }

        try {
            setLoading(true);
            if (editingStore) {
                await api.put(`/market/stores/${editingStore.id}`, data);
            } else {
                await api.post('/market/stores', data);
            }
            fetchStores();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save store:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(s => 
        s.store_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Store Management</h2>
                    <p className="text-gray-400">Manage business partners and marketplace vendors.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-black font-black px-6 py-3 rounded-2xl flex items-center space-x-2 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>REGISTER STORE</span>
                </button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Search stores..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-primary transition-all text-text"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map(store => (
                    <div key={store.id} className="glass p-6 rounded-3xl group relative overflow-hidden flex flex-col">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                                {store.store_logo ? (
                                    <img 
                                        src={store.store_logo.startsWith('http') ? store.store_logo : `${api.defaults.baseURL?.replace('/admin', '')}${store.store_logo}`} 
                                        alt={store.store_name} 
                                        className="w-full h-full object-contain bg-white/5"
                                    />
                                ) : (
                                    <Store className="w-8 h-8 text-primary opacity-20" />
                                )}
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleOpenModal(store)}
                                    className="p-2 bg-white/5 rounded-xl hover:bg-primary hover:text-black transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all">
                                    <Archive className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2">{store.store_name}</h3>
                        <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">{store.store_description}</p>
                        
                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                            <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                Registered: {new Date(store.created_at).toLocaleDateString()}
                            </div>
                            <Link 
                                to={`/inventory/${store.id}`}
                                className="text-primary text-xs font-black uppercase tracking-widest hover:underline"
                            >
                                View Items
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <div className="glass w-full max-w-xl rounded-3xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-2xl font-bold">{editingStore ? 'Edit Store' : 'Register New Store'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="flex flex-col items-center mb-4">
                                <div className="w-24 h-24 bg-white/5 rounded-3xl border border-white/10 relative group overflow-hidden flex items-center justify-center">
                                    {formData.previewUrl ? (
                                        <img src={formData.previewUrl} className="w-full h-full object-contain bg-white/5" />
                                    ) : (
                                        <Store className="w-10 h-10 text-gray-500" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white mb-2" />
                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                    </label>
                                </div>
                                <p className="text-[10px] uppercase font-black text-gray-500 mt-2 tracking-widest">Store Logo</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Store Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.store_name}
                                        onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all"
                                        placeholder="Enter store name..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Description</label>
                                    <textarea 
                                        required
                                        value={formData.store_description}
                                        onChange={(e) => setFormData({...formData, store_description: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all min-h-[120px] resize-none"
                                        placeholder="Describe the store..."
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                <span>{editingStore ? 'UPDATE STORE' : 'CREATE STORE'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stores;
