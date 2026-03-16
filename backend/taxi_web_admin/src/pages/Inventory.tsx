import { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Plus, Search, Edit2, Trash2, Upload, X, Save, DollarSign, Layers } from 'lucide-react';

const Inventory = () => {
    const [items, setItems] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStore, setSelectedStore] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({
        store_id: '',
        item_name: '',
        description: '',
        price: '',
        stock_quantity: '',
        status: 'active',
        image: null as File | null,
        previewUrl: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [iRes, sRes] = await Promise.all([
                api.get('/market/items'),
                api.get('/market/stores')
            ]);
            setItems(iRes.data.items || []);
            setStores(sRes.data.stores || []);
        } catch (error) {
            console.error('Failed to fetch items/stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item: any = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                store_id: item.store_id,
                item_name: item.item_name,
                description: item.description,
                price: item.price.toString(),
                stock_quantity: item.stock_quantity.toString(),
                status: item.status,
                image: null,
                previewUrl: item.image_url || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                store_id: selectedStore,
                item_name: '',
                description: '',
                price: '',
                stock_quantity: '',
                status: 'active',
                image: null,
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
                image: file,
                previewUrl: URL.createObjectURL(file)
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key !== 'logo' && key !== 'previewUrl' && key !== 'image') {
                data.append(key, (formData as any)[key]);
            }
        });
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            setLoading(true);
            if (editingItem) {
                await api.put(`/market/items/${editingItem.id}`, data);
            } else {
                await api.post('/market/items', data);
            }
            fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/market/items/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    const filteredItems = items.filter(i => {
        const matchesSearch = i.item_name.toLowerCase().includes(search.toLowerCase());
        const matchesStore = !selectedStore || i.store_id === selectedStore;
        return matchesSearch && matchesStore;
    });

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Inventory Management</h2>
                    <p className="text-gray-400">Control products and stock levels across all stores.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-black font-black px-6 py-3 rounded-2xl flex items-center space-x-2 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>ADD PRODUCT</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-primary transition-all text-text"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-primary transition-all text-text"
                    >
                        <option value="">All Stores</option>
                        {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.store_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-[10px] font-black uppercase text-gray-500 tracking-widest border-b border-white/5">
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Store</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">In Stock</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredItems.map(item => {
                            const store = stores.find(s => s.id === item.store_id);
                            return (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img 
                                                        src={item.image_url.startsWith('http') ? item.image_url : `${api.defaults.baseURL?.replace('/admin', '')}${item.image_url}`} 
                                                        className="w-full h-full object-cover" 
                                                        alt={item.item_name}
                                                    />
                                                ) : (
                                                    <Package className="w-6 h-6 text-primary opacity-20" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold">{item.item_name}</p>
                                                <p className="text-[10px] text-gray-500 line-clamp-1">{item.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-gray-400">{store?.store_name || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-primary">K{Math.round(item.price)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full ${item.stock_quantity > 10 ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                            <span className="text-sm font-bold">{item.stock_quantity}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                            item.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 bg-white/5 rounded-xl hover:bg-primary hover:text-black transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                    <div className="glass w-full max-w-2xl rounded-3xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center text-primary font-black uppercase tracking-tighter">
                            <h3 className="text-2xl font-bold">{editingItem ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-32 h-32 bg-white/5 rounded-3xl border border-white/10 relative group overflow-hidden flex items-center justify-center shadow-2xl">
                                    {formData.previewUrl ? (
                                        <img src={formData.previewUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-12 h-12 text-gray-500" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white mb-2" />
                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                    </label>
                                </div>
                                <p className="text-[10px] uppercase font-black text-gray-500 mt-2 tracking-widest">Product Image</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Assigned Store</label>
                                    <select 
                                        required
                                        value={formData.store_id}
                                        onChange={(e) => setFormData({...formData, store_id: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all"
                                    >
                                        <option value="">Select store...</option>
                                        {stores.map(s => (
                                            <option key={s.id} value={s.id}>{s.store_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Product Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.item_name}
                                        onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all"
                                        placeholder="Enter product name..."
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Description</label>
                                    <textarea 
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all min-h-[80px] resize-none"
                                        placeholder="Product description..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Price (K)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="number" 
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Stock Quantity</label>
                                    <div className="relative">
                                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="number" 
                                            required
                                            value={formData.stock_quantity}
                                            onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/10 disabled:opacity-50"
                                >
                                    {editingItem ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
