import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Mail,
    Phone,
    Calendar,
    Ban,
    CheckCircle2
} from 'lucide-react';

interface Passenger {
    id: number;
    name: string;
    email: string;
    phone: string;
    profile_photo: string | null;
    status: 'active' | 'suspended';
    created_at: string;
    last_login_at: string | null;
    total_trips: number;
}

const Passengers: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchPassengers();
    }, []);

    const fetchPassengers = async () => {
        try {
            const res = await api.get('/admin/passengers');
            if (res.data.success) {
                setPassengers(res.data.passengers);
            }
        } catch (error) {
            console.error('Error fetching passengers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (id: number, currentStatus: string) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'suspend' : 'activate'} this user?`)) return;

        try {
            const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
            const res = await api.put(`/admin/users/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setPassengers(passengers.map(p => p.id === id ? { ...p, status: newStatus } : p));
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const filteredPassengers = passengers.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.phone?.includes(searchTerm);
        const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="p-10 text-center text-gray-400">Loading passengers...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Passengers</h2>
                    <p className="text-gray-400">Manage registered passengers and their accounts.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-surface border border-white/10 rounded-xl px-4 py-2 flex items-center w-64">
                        <Search className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search passengers..."
                            className="bg-transparent border-none focus:outline-none text-sm w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5 text-left">
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Passenger</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Contact Info</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Trips</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Joined</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPassengers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-gray-500">No passengers found.</td>
                            </tr>
                        ) : filteredPassengers.map((passenger) => (
                            <tr key={passenger.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-6">
                                    <div
                                        className="flex items-center cursor-pointer group"
                                        onClick={() => navigate(`/passengers/${passenger.id}`)}
                                    >
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold mr-3 overflow-hidden border border-primary/20 group-hover:border-primary transition-colors">
                                            {passenger.profile_photo ? (
                                                <img src={passenger.profile_photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                passenger.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{passenger.name}</p>
                                            <p className="text-xs text-gray-500">ID: #{passenger.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center text-xs text-gray-400">
                                            <Mail className="w-3 h-3 mr-2" /> {passenger.email}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-400">
                                            <Phone className="w-3 h-3 mr-2" /> {passenger.phone}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="font-bold">{passenger.total_trips}</span>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center text-xs text-gray-400">
                                        <Calendar className="w-3 h-3 mr-2" />
                                        {new Date(passenger.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${passenger.status === 'active'
                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        }`}>
                                        {passenger.status}
                                    </span>
                                </td>
                                <td className="p-6">
                                    {(passenger.status === 'active' || (user?.role === 'super_admin')) && (
                                        <button
                                            onClick={() => handleStatusToggle(passenger.id, passenger.status)}
                                            className={`p-2 rounded-lg transition-all ${passenger.status === 'active'
                                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                    : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                }`}
                                            title={passenger.status === 'active' ? 'Suspend' : 'Activate'}
                                        >
                                            {passenger.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Passengers;
