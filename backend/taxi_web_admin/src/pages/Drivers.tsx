import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search,
    UserX,
    UserCheck,
    Star,
    Car,
    Phone,
    ChevronRight,
    Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Drivers: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchDrivers();

        // Auto-refresh every 10 seconds
        const interval = setInterval(() => {
            fetchDrivers(true);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchDrivers = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await api.get('/admin/drivers');
            if (res.data.success) {
                setDrivers(res.data.drivers || []);
            }
        } catch (error) {
            console.error('Fetch drivers error:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
        try {
            const res = await api.post(`/admin/drivers/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setDrivers(drivers.map(d => d.id === id ? { ...d, status: newStatus } : d));
            }
        } catch (error) {
            console.error('Update status error:', error);
        }
    };

    const filteredDrivers = drivers.filter(d => {
        const nameMatch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = (d.phone || '').includes(searchTerm);
        const plateMatch = (d.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = filterStatus === 'all' || d.status === filterStatus;
        return (nameMatch || phoneMatch || plateMatch) && statusMatch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full uppercase tracking-wider">Active</span>;
            case 'suspended':
                return <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full uppercase tracking-wider">Suspended</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">Pending</span>;
            default:
                return <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs font-bold rounded-full uppercase tracking-wider">{status || 'Unknown'}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Driver Fleet</h2>
                    <p className="text-gray-400">Manage and monitor all registered platform drivers.</p>
                </div>

                <div className="flex space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search name, phone, or plate..."
                            className="bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-surface border border-white/5 rounded-xl px-4 py-2 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Active Only</option>
                        <option value="suspended">Suspended Only</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 text-center text-gray-500 flex flex-col items-center justify-center space-y-4">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p>Loading driver records...</p>
                    </div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="p-20 text-center text-gray-500 bg-surface rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4">
                        <Users className="w-12 h-12 text-gray-700" />
                        <p>No drivers found matching your criteria.</p>
                    </div>
                ) : filteredDrivers.map((driver) => (
                    <div key={driver.id} className="glass p-6 rounded-3xl flex items-center group hover:bg-white/5 transition-all">
                        <div className="relative w-16 h-16 mr-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20 shrink-0">
                                {driver.profile_photo ? (
                                    <img
                                        src={driver.profile_photo}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    (driver.name || '?').charAt(0)
                                )}
                                {driver.profile_photo && <span className="hidden w-full h-full flex items-center justify-center bg-primary/10 absolute top-0 left-0">{(driver.name || '?').charAt(0)}</span>}
                            </div>
                            {/* Online Status Indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-surface ${driver.online_status === 'online' ? 'bg-green-500' :
                                driver.online_status === 'on_trip' ? 'bg-amber-500' :
                                    'bg-gray-500'
                                }`} title={driver.online_status === 'on_trip' ? "On Trip" : driver.online_status === 'online' ? "Online" : "Offline"}></div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="col-span-1">
                                <h3 className="font-bold text-lg flex items-center">
                                    {driver.name || 'Unnamed Driver'}
                                    {driver.online_status === 'online' && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                                    {driver.online_status === 'on_trip' && <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>}
                                </h3>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Phone className="w-3 h-3 mr-1" /> {driver.phone || 'No Phone'}
                                </div>
                            </div>

                            <div className="col-span-1">
                                <div className="flex items-center text-sm font-medium">
                                    <Car className="w-4 h-4 mr-2 text-primary" />
                                    {driver.car_model || 'No Vehicle'}
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">{driver.plate_number || '---'}</p>
                            </div>

                            <div className="col-span-1 flex flex-col items-start md:items-center">
                                <div className="flex items-center space-x-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`w-3 h-3 ${s <= (driver.rating || 0) ? 'text-secondary fill-secondary' : 'text-gray-700'}`} />
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">{driver.total_trips || 0} Trips Completed</p>
                            </div>

                            <div className="col-span-1 flex items-center justify-end space-x-6">
                                {getStatusBadge(driver.status)}
                                <div className="flex items-center space-x-2">
                                    {(driver.status !== 'suspended' || user?.role === 'super_admin') && (
                                        <button
                                            onClick={() => toggleStatus(driver.id, driver.status)}
                                            className={`p-2 rounded-xl transition-all ${driver.status === 'suspended'
                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black'
                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black'
                                                }`}
                                            title={driver.status === 'suspended' ? 'Activate' : 'Suspend'}
                                        >
                                            {driver.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate(`/drivers/${driver.id}`)}
                                        className="p-2 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-text transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Drivers;
