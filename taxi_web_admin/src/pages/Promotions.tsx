import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Calendar, Percent, Banknote, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

interface Promotion {
    id: number;
    code: string;
    title: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    expiry_date: string;
    status: 'active' | 'inactive';
}

const Promotions: React.FC = () => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        expiry_date: ''
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const response = await api.get('/promotions');
            if (response.data.success) {
                setPromotions(response.data.promotions);
            }
        } catch (err) {
            console.error('Error fetching promotions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const response = await api.post('/admin/promotions', formData);

            if (response.data.success) {
                setSuccess('Promotion created successfully!');
                fetchPromotions();
                setShowModal(false);
                setFormData({
                    code: '',
                    title: '',
                    description: '',
                    discount_type: 'percentage',
                    discount_value: '',
                    expiry_date: ''
                });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error creating promotion');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;

        try {
            await api.delete(`/admin/promotions/${id}`);
            fetchPromotions();
        } catch (err) {
            console.error('Error deleting promotion:', err);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary" />
                        Promotions
                    </h1>
                    <p className="text-gray-400">Manage passenger discounts and offers</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    New Promo Code
                </button>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => (
                    <div key={promo.id} className="glass p-6 rounded-2xl border border-white/5 space-y-4 relative group">
                        <div className="flex justify-between items-start">
                            <div className="bg-primary/20 p-3 rounded-xl">
                                <Tag className="w-6 h-6 text-primary" />
                            </div>
                            <button
                                onClick={() => handleDelete(promo.id)}
                                className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{promo.title}</h3>
                            <p className="text-gray-400 text-sm">{promo.description}</p>
                        </div>
                        <div className="flex items-center gap-4 py-2">
                            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-sm font-mono font-bold text-primary">
                                {promo.code}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold">
                                {promo.discount_type === 'percentage' ? (
                                    <><Percent className="w-4 h-4 text-secondary" /> {promo.discount_value}% OFF</>
                                ) : (
                                    <><Banknote className="w-4 h-4 text-green-500" /> K {promo.discount_value} OFF</>
                                )}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Expires: {new Date(promo.expiry_date).toLocaleDateString()}
                            </div>
                            <span className={`px-2 py-1 rounded-md ${promo.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {promo.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass max-w-md w-full p-8 rounded-3xl border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Create New Promotion</h2>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl flex items-center gap-2 mb-6">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Promo Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none uppercase"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. SUMMER2024"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Offer Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Summer Special"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none h-24"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Explain the offer details..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.discount_type}
                                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (K)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.discount_value}
                                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                        placeholder="e.g. 10"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Expiry Date</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Offer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Promotions;
