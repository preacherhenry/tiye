import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    Users,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Car,
    User,
    Trash2,
    Eye,
    ChevronRight
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/rbac';

export const Overview: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Sync every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/dashboard-stats');
            if (res.data.success) {
                setData(res.data);
                setError(null);
            } else {
                setError(res.data.message || 'Failed to fetch statistics');
            }
        } catch (err: any) {
            console.error('Overview fetch error:', err);
            setError(err.response?.data?.message || err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete the application from "${name}"?`)) return;

        try {
            const res = await api.delete(`/admin/applications/${id}`);
            if (res.data.success) {
                fetchStats(); // Refresh dashboard
                alert('Application deleted successfully');
            } else {
                alert(res.data.message);
            }
        } catch (error: any) {
            console.error('Delete error:', error);
            alert(error.response?.data?.message || 'Error occurred while deleting');
        }
    };

    const StatCard = ({ label, value, icon: Icon, color }: any) => (
        <div className="glass p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-${color}/20 transition-all`}></div>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${color}/10 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{value}</h3>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</p>
        </div>
    );

    if (loading) return (
        <div className="p-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-gray-400 font-medium">Synchronizing platform data...</div>
        </div>
    );

    if (error || !data) return (
        <div className="p-20 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 text-xl font-bold mb-2">Connection Issue</div>
            <div className="text-gray-400 mb-8">{error || 'Service unavailable. Please check backend connection.'}</div>
            <button 
                onClick={fetchStats}
                className="px-8 py-3 bg-primary text-black font-bold rounded-xl hover:scale-105 transition-all"
            >
                RETRY CONNECTION
            </button>
        </div>
    );

    const { stats } = data;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome Back, {user?.role.replace(/_/g, ' ')}</h2>
                    <p className="text-gray-400">Here's what's happening on the platform today, {user?.name}.</p>
                </div>
                <div className="flex items-center space-x-2 text-primary bg-primary/10 px-4 py-2 rounded-xl text-sm font-bold border border-primary/20 animate-pulse">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>LIVE UPDATES</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Pending Applications" value={stats.pending} icon={Clock} color="primary" />
                <StatCard label="Approved Drivers" value={stats.approved} icon={CheckCircle2} color="green-500" />
                <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="red-500" />
                <StatCard label="Suspended" value={stats.suspended} icon={Users} color="secondary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="glass p-8 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center">
                            <Clock className="w-5 h-5 mr-3 text-primary" />
                            Recent Applications
                        </h3>
                        <button 
                            onClick={() => navigate('/applications')}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            VIEW ALL
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {!data.recentActivity || data.recentActivity.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-10">No recent applications found.</p>
                        ) : data.recentActivity.map((activity: any) => (
                            <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                        {activity.avatar ? (
                                            <img src={activity.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {activity.user?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{activity.user}</p>
                                        <p className="text-xs text-gray-400">{activity.details}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{new Date(activity.time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => navigate(`/applications/${activity.id}`)}
                                        className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-primary hover:text-black transition-all"
                                        title="View Detail"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(activity.id, activity.user)}
                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Shortcuts / Info */}
                <div className="space-y-8">
                    <div className="glass p-8 rounded-3xl min-h-[180px] flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-lg font-bold text-gray-400 mb-2">Total Passengers</h3>
                        <p className="text-4xl font-black text-blue-500 tracking-tighter">{stats.totalPassengers}</p>
                        <p className="text-gray-500 text-xs mt-2">Active riders currently registered.</p>
                    </div>
                    
                    <div className="glass p-8 rounded-3xl min-h-[180px] flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-lg font-bold text-gray-400 mb-2">Online Drivers</h3>
                        <p className="text-4xl font-black text-green-500 tracking-tighter">{stats.onlineDrivers}</p>
                        <p className="text-gray-500 text-xs mt-2">Chauffeurs active on the platform.</p>
                        <button 
                            onClick={() => navigate('/drivers')}
                            className="mt-4 text-xs font-bold text-green-500 hover:underline flex items-center"
                        >
                            MANAGE FLEET <ChevronRight className="w-3 h-3 ml-1" />
                        </button>
                    </div>
                </div>
            </div>

            {hasPermission(user?.role, 'marketplace:manage') && (
                <div className="glass p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-1">Marketplace Ecosystem</h3>
                            <p className="text-gray-400 text-sm">Monitor your advertising slots and partner stores</p>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => navigate('/posters')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all underline">MANAGE POSTERS</button>
                            <button onClick={() => navigate('/stores')} className="px-4 py-2 bg-primary text-black rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20">VIEW ALL STORES</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Active Posters</p>
                            <p className="text-2xl font-black text-primary">8 / 8</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Partner Stores</p>
                            <p className="text-2xl font-black">Active</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Inventory Items</p>
                            <p className="text-2xl font-black">Managed</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
    return (
        <div className="flex bg-background min-h-screen text-text">
            <Sidebar />
            <main className="flex-1 ml-64 p-10">
                <Outlet />
            </main>
        </div>
    );
};

export default Dashboard;
