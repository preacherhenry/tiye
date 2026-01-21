import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft,
    CreditCard,
    Pause,
    Play,
    Trash2,
    Calendar,
    Clock,
    History,
    Activity
} from 'lucide-react';

const DriverSubscriptions: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/admin/drivers/${id}/profile`);
            if (res.data.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch driver data:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePauseSub = async (subId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
        try {
            const res = await api.put(`/subscriptions/admin/subscriptions/${subId}/toggle-pause`, { status: newStatus });
            if (res.data.success) {
                fetchData();
            }
        } catch (error) {
            console.error('Toggle pause error:', error);
        }
    };

    const deleteSub = async (subId: number) => {
        if (!window.confirm('Are you sure you want to delete this subscription?')) return;
        try {
            const res = await api.delete(`/subscriptions/admin/subscriptions/${subId}`);
            if (res.data.success) {
                fetchData();
            }
        } catch (error) {
            console.error('Delete sub error:', error);
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-500">Loading subscription records...</div>;
    if (!data) return <div className="p-20 text-center text-gray-500">Driver not found.</div>;

    const { driver, subscriptions = [] } = data;

    // Filter subscriptions
    const activeAndPending = subscriptions.filter((s: any) => s.status === 'active' || s.status === 'pending' || s.status === 'paused');


    const displaySubs = showHistory ? subscriptions : activeAndPending;

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(`/drivers/${id}`)}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold mb-1 flex items-center">
                            <CreditCard className="w-8 h-8 mr-4 text-primary" />
                            Subscriptions
                        </h2>
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em]">
                            Manage {driver.name}'s Access Plans
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border ${showHistory
                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                        }`}
                >
                    <History className="w-4 h-4 mr-2" />
                    {showHistory ? 'Viewing All Records' : 'View History Only'}
                </button>
            </div>

            {/* Content */}
            <div className="glass p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02]">
                    <CreditCard className="w-64 h-64" />
                </div>

                <div className="relative z-10">
                    {displaySubs.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                                <Clock className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400 mb-2">No active subscriptions found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                                This driver does not currently have any active or pending subscription plans.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displaySubs.map((sub: any) => (
                                <div key={sub.id} className="p-6 bg-white/[0.03] rounded-[2rem] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.06] transition-all group">
                                    <div className="flex items-center">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-6 border shadow-xl ${sub.status === 'active' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                            sub.status === 'paused' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                sub.status === 'pending' ? 'bg-primary/10 border-primary/20 text-primary' :
                                                    'bg-gray-500/10 border-white/5 text-gray-500'
                                            }`}>
                                            <Activity className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="font-black text-xl tracking-tight">{sub.plan_name}</p>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${sub.status === 'active' ? 'bg-green-500 text-black' :
                                                    sub.status === 'paused' ? 'bg-amber-500 text-black' :
                                                        sub.status === 'pending' ? 'bg-primary text-black' :
                                                            'bg-gray-800 text-gray-400'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 font-bold space-x-4">
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1 text-primary opacity-50" />
                                                    {sub.expiry_date ? `Expires ${new Date(sub.expiry_date).toLocaleDateString()}` : `K ${sub.price} • ${sub.duration_days} Days`}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1 text-primary opacity-50" />
                                                    Joined {new Date(sub.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {(sub.status === 'active' || sub.status === 'paused') && (
                                            <button
                                                onClick={() => togglePauseSub(sub.id, sub.status)}
                                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center border ${sub.status === 'paused'
                                                    ? 'bg-green-500 text-black border-green-500 hover:bg-green-400'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white'
                                                    }`}
                                            >
                                                {sub.status === 'paused' ? (
                                                    <><Play className="w-4 h-4 mr-2" /> Resume Account</>
                                                ) : (
                                                    <><Pause className="w-4 h-4 mr-2" /> Pause Access</>
                                                )}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => deleteSub(sub.id)}
                                            className="p-3.5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95 group-hover:shadow-lg group-hover:shadow-red-500/20"
                                            title="Permanently Delete Record"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverSubscriptions;
