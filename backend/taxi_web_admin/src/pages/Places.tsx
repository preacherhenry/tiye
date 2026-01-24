import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, Loader2, AlertCircle, CheckCircle2, Search, Map as MapIcon, Globe } from 'lucide-react';
import api from '../services/api';

interface Place {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    category: string;
    area: string;
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

    const [formData, setFormData] = useState({
        name: '',
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

    const handleEdit = (place: Place) => {
        setEditingPlace(place);
        setFormData({
            name: place.name,
            latitude: place.latitude.toString(),
            longitude: place.longitude.toString(),
            category: place.category,
            area: place.area
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlace(null);
        setFormData({
            name: '',
            latitude: '',
            longitude: '',
            category: 'landmark',
            area: ''
        });
    };

    const filteredPlaces = places.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.category.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <p className="text-gray-400 text-sm">Manage Chirundu locations not found on Google Maps</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Add New Place
                </button>
            </div>

            {success && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="w-5 h-5" />
                    {success}
                </div>
            )}

            {/* Search bar */}
            <div className="glass p-4 rounded-2xl flex items-center gap-3 border border-white/5">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search places by name, area or category..."
                    className="bg-transparent border-none outline-none flex-1 text-text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs font-black uppercase tracking-wider">
                            <th className="px-6 py-4">Place Name</th>
                            <th className="px-6 py-4">Category / Area</th>
                            <th className="px-6 py-4">Coordinates (Lat, Lng)</th>
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
                                    <div className="flex items-center gap-2">
                                        <span className="bg-secondary/10 text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                            {place.category}
                                        </span>
                                        <span className="text-gray-400 text-sm">{place.area}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3 text-sm font-mono text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Globe className="w-3 h-3 text-primary/50" />
                                            {place.latitude.toFixed(6)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Globe className="w-3 h-3 text-primary/50" />
                                            {place.longitude.toFixed(6)}
                                        </div>
                                    </div>
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
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
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
                                <p className="text-xs text-gray-400 tracking-wide">Enter the details for the custom landmark.</p>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1.5 ml-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                            placeholder="-16.0375"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1.5 ml-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                            placeholder="28.8530"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1.5 ml-1">Category</label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
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
                                        <label className="block text-sm text-gray-400 mb-1.5 ml-1">Area / Suburb</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                            value={formData.area}
                                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                            placeholder="e.g. Chirundu North"
                                        />
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
