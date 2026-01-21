import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    Users,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Car,
    User
} from 'lucide-react';

import api from '../services/api';

export const Overview: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/dashboard-stats');
            if (res.data.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Overview fetch error:', error);
        } finally {
            setLoading(false);
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

    if (loading) return <div className="p-20 text-center text-gray-400 font-medium">Synchronizing platform data...</div>;
    if (!data) return <div className="p-20 text-center text-red-500">Service unavailable. Please check backend connection.</div>;

    const { stats } = data;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome Back, Admin</h2>
                    <p className="text-gray-400">Here's what's happening on the platform today.</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Total Passengers */}
                <div className="glass p-8 rounded-3xl min-h-[400px] flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-xl shadow-blue-500/10">
                        <User className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 mb-1">Total Passengers</h3>
                    <p className="text-5xl font-black mb-4 tracking-tighter text-blue-500">{stats.totalPassengers}</p>
                    <p className="text-gray-500 text-sm max-w-xs font-medium">Registered passengers actively using the service.</p>
                </div>

                {/* Total Users */}
                <div className="glass p-8 rounded-3xl min-h-[400px] flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 border border-purple-500/20 shadow-xl shadow-purple-500/10">
                        <Users className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 mb-1">Total Users</h3>
                    <p className="text-5xl font-black mb-4 tracking-tighter text-purple-500">{stats.totalUsers}</p>
                    <p className="text-gray-500 text-sm max-w-xs font-medium">Combined count of drivers, passengers, and admins.</p>
                </div>

                {/* Online Drivers */}
                <div className="glass p-8 rounded-3xl min-h-[400px] flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-xl shadow-green-500/10">
                        <Car className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-400 mb-1">Online Drivers</h3>
                    <p className="text-5xl font-black mb-4 tracking-tighter text-green-500">{stats.onlineDrivers}</p>
                    <p className="text-gray-500 text-sm max-w-xs font-medium">Active chauffeurs currently available or on trip.</p>
                    <button
                        onClick={() => window.location.href = '/drivers'}
                        className="mt-8 px-6 py-2 bg-green-500/10 text-green-500 rounded-xl font-bold hover:bg-green-500 hover:text-black transition-all text-xs border border-green-500/20"
                    >
                        VIEW FLEET
                    </button>
                </div>
            </div>
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
