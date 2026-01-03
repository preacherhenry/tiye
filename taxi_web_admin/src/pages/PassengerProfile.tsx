import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Mail,
    Phone,
    Calendar,
    ArrowLeft,
    Clock,
    Car
} from 'lucide-react';
import api from '../services/api';

const PassengerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/admin/passengers/${id}/profile`);
            if (res.data.success) {
                setProfile(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Loading profile...</div>;
    if (!profile) return <div className="p-10 text-center text-red-500">Passenger not found</div>;

    const { user, trips, stats } = profile;

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/passengers')}
                    className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Passengers
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center"><Mail className="w-4 h-4 mr-2" /> {user.email}</span>
                            <span className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {user.phone}</span>
                        </div>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${user.status === 'active'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        {user.status}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Trips</p>
                    <p className="text-3xl font-black">{stats.total_trips}</p>
                </div>
                <div className="glass p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Completed</p>
                    <p className="text-3xl font-black text-green-500">{stats.completed_trips}</p>
                </div>
                <div className="glass p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Cancelled</p>
                    <p className="text-3xl font-black text-red-500">{stats.cancelled_trips}</p>
                </div>
                <div className="glass p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Spent</p>
                    <p className="text-3xl font-black text-yellow-500">${stats.total_spent.toFixed(2)}</p>
                </div>
            </div>

            {/* Trip History */}
            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5">
                    <h3 className="text-xl font-bold flex items-center">
                        <Car className="w-5 h-5 mr-3 text-primary" />
                        Trip History
                    </h3>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5 text-left">
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Driver</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Route</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Fare</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {trips.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-gray-500">No trips found.</td>
                            </tr>
                        ) : trips.map((trip: any) => (
                            <tr key={trip.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center text-sm text-gray-400">
                                        <Calendar className="w-3 h-3 mr-2" />
                                        {new Date(trip.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <Clock className="w-3 h-3 mr-2" />
                                        {new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="p-6">
                                    {trip.driver_name ? (
                                        <div className="font-bold text-sm text-primary">{trip.driver_name}</div>
                                    ) : (
                                        <span className="text-gray-600 text-xs italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="p-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <span className="truncate max-w-[200px]" title={trip.pickup_location}>{trip.pickup_location}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                            <span className="truncate max-w-[200px]" title={trip.dropoff_location}>{trip.dropoff_location}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 font-bold text-sm">
                                    ${Number(trip.fare || 0).toFixed(2)}
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${trip.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                        trip.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                        {trip.status}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <button
                                        onClick={() => navigate(`/trips/${trip.id}`)}
                                        className="text-xs font-bold text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1 rounded-lg transition-all"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PassengerProfile;
