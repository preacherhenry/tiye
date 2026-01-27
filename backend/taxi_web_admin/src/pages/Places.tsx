import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, Loader2, AlertCircle, CheckCircle2, Search, Map as MapIcon } from 'lucide-react';
import api from '../services/api';

interface Place {
    id: string;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    category?: string;
    area?: string;
    created_at: string;
}

const Places: React.FC = () => {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);

    // Quick Add State
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddDescription, setQuickAddDescription] = useState('');
    const [isQuickAdding, setIsQuickAdding] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        category: 'landmark',
        area: ''
    });

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        try {
            const response = await api.get('/places');
            if (response.data.success) {
                setPlaces(response.data.places);
            }
        } catch (err) {
            console.error('Error fetching places:', err);
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
            let response;
            if (editingPlace) {
                response = await api.put(`/places/${editingPlace.id}`, formData);
            } else {
                response = await api.post('/places', formData);
            }

            if (response.data.success) {
                setSuccess(editingPlace ? 'Place updated successfully!' : 'Place added successfully!');
                fetchPlaces();
                handleCloseModal();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error processing request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this place?')) return;

        try {
            await api.delete(`/places/${id}`);
            setSuccess('Place deleted successfully');
            fetchPlaces();
        } catch (err) {
            console.error('Error deleting place:', err);
        }
    };

    const handleQuickAdd = async () => {
        if (!quickAddName.trim()) return;

        setError('');
        setSuccess('');
        setIsQuickAdding(true);

        try {
            const response = await api.post('/places', {
                name: quickAddName.trim(),
                description: quickAddDescription.trim()
            });

            if (response.data.success) {
                setSuccess(`✓ Added "${quickAddName}"`);
                setQuickAddName('');
                setQuickAddDescription('');
                fetchPlaces();

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error adding place');
        } finally {
            setIsQuickAdding(false);
        }
    };

    const handleEdit = (place: Place) => {
        setEditingPlace(place);
        setFormData({
            name: place.name,
            description: place.description || '',
            latitude: place.latitude?.toString() || '',
            longitude: place.longitude?.toString() || '',
            category: place.category || 'landmark',
            area: place.area || ''
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlace(null);
        setFormData({
            name: '',
            description: '',
            latitude: '',
            longitude: '',
            category: 'landmark',
            area: ''
        });
    };

    const filteredPlaces = places.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.description && place.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div className="flex items-center justify-center h-full text-primary"><Loader2 className="animate-spin w-10 h-10" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-primary" />
                        Custom Places & Landmarks
                    </h1>
                    <p className="text-gray-400 text-sm">Manage custom place names for autocomplete suggestions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Add New Place
                </button>
            </div>



            {/* Search bar */}
            <div className="glass p-4 rounded-2xl flex items-center gap-3 border border-white/5">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search places by name or description..."
                    className="bg-transparent border-none outline-none flex-1 text-text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Quick Add Section */}
            <div className="glass p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-gray-300">Quick Add Place</h3>
                    <span className="text-xs text-gray-500">• Fast entry for autocomplete suggestions</span>
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Place name (e.g., Town Square)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        value={quickAddName}
                        onChange={(e) => setQuickAddName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                        disabled={isQuickAdding}
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        value={quickAddDescription}
                        onChange={(e) => setQuickAddDescription(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                        disabled={isQuickAdding}
                    />
                    <button
                        onClick={handleQuickAdd}
                        disabled={!quickAddName.trim() || isQuickAdding}
                        className="bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isQuickAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                    </button>
                </div>
                {success && (
                    <div className="mt-3 flex items-center gap-2 text-green-500 text-sm animate-in fade-in slide-in-from-top-1 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 w-fit">
                        <CheckCircle2 className="w-4 h-4" />
                        {success}
                    </div>
                )}
            </div>


            <div className="glass rounded-3xl overflow-hidden border border-white/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs font-black uppercase tracking-wider">
                            <th className="px-6 py-4">Place Name</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPlaces.length > 0 ? filteredPlaces.map((place) => (
                            <tr key={place.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-text">{place.name}</div>
                                    <div className="text-[10px] text-gray-500 font-mono">ID: {place.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-400 text-sm">{place.description || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(place)}
                                            className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(place.id)}
                                            className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                    No places found{searchQuery ? ` matching "${searchQuery}"` : ''}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass max-w-xl w-full p-8 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary/20 p-3 rounded-2xl">
                                <MapIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{editingPlace ? 'Update Place' : 'Add New Location'}</h2>
                                <p className="text-xs text-gray-400 tracking-wide">Add place names for autocomplete. Coordinates will be resolved via Google Maps.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5 ml-1">Place Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Sidu Bakery"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1.5 ml-1">Description (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. Major Junction, Night Club, School, etc."
                                    />
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                                        <MapIcon className="w-4 h-4" />
                                        Coordinate Details (Optional)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1.5 ml-1">Latitude</label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                                                value={formData.latitude}
                                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                                placeholder="-16.0375"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1.5 ml-1">Longitude</label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                                                value={formData.longitude}
                                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                                placeholder="28.8530"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1.5 ml-1">Category</label>
                                            <select
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="landmark">Landmark</option>
                                                <option value="shop">Shop / Business</option>
                                                <option value="lodge">Lodge / Hotel</option>
                                                <option value="government">Government</option>
                                                <option value="school">School</option>
                                                <option value="church">Church</option>
                                                <option value="hospital">Hospital</option>
                                                <option value="junction">Major Junction</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1.5 ml-1">Area / Suburb</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                                                value={formData.area}
                                                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                                placeholder="e.g. Chirundu North"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingPlace ? 'Update Location' : 'Save Landmark'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Places;
