import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft,
    Phone,
    Mail,
    Star,
    Car,
    DollarSign,
    CheckCircle2,
    XCircle,
    UserX,
    UserCheck,
    Calendar,
    ChevronRight,
    Activity,
    TrendingUp
} from 'lucide-react';

const DriverProfile: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();

        // Set up auto-refresh every 10 seconds
        const interval = setInterval(() => {
            fetchProfile(true); // pass true to skip loading state
        }, 10000);

        return () => clearInterval(interval);
    }, [id]);

    const fetchProfile = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const res = await api.get(`/admin/drivers/${id}/profile`);
            if (res.data.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const toggleStatus = async () => {
        const currentStatus = data.driver.status;
        const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
        try {
            const res = await api.post(`/admin/drivers/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setData({
                    ...data,
                    driver: { ...data.driver, status: newStatus }
                });
            }
        } catch (error) {
            console.error('Update status error:', error);
        }
    };

    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'busy':
                return (
                    <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl border border-amber-500/20 animate-pulse">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Busy / On Trip</span>
                    </div>
                );
            case 'idle':
                return (
                    <div className="flex items-center space-x-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-xl border border-green-500/20">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Online / Idle</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center space-x-2 bg-gray-500/10 text-gray-500 px-4 py-2 rounded-xl border border-white/5">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Offline</span>
                    </div>
                );
        }
    };

    if (loading) return (
        <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="font-bold uppercase tracking-widest text-[10px]">Retrieving detailed chauffeur profile...</p>
        </div>
    );

    if (!data) return (
        <div className="p-20 text-center text-red-500 glass rounded-[2rem] border border-red-500/10">
            <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold">Driver Not Found</h3>
            <p className="mt-2 text-sm opacity-70">The driver account you're looking for doesn't exist.</p>
        </div>
    );

    const { driver, stats, trips, activeTrip } = data;

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/drivers')}
                    className="flex items-center text-gray-400 hover:text-white transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Drivers</span>
                </button>
                <div className="flex items-center space-x-4">
                    {getStatusIndicator(driver.realTimeStatus)}
                    <div className="w-px h-8 bg-white/5"></div>
                    <button
                        onClick={toggleStatus}
                        className={`flex items-center px-6 py-2 rounded-xl font-bold transition-all ${driver.status === 'suspended'
                            ? 'bg-green-500 text-black hover:bg-green-400'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'
                            }`}
                    >
                        {driver.status === 'suspended' ? (
                            <><UserCheck className="w-4 h-4 mr-2" /> Activate Driver</>
                        ) : (
                            <><UserX className="w-4 h-4 mr-2" /> Suspend Driver</>
                        )}
                    </button>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 glass p-8 rounded-[2rem] flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center text-5xl text-primary font-black overflow-hidden border-2 border-primary/20 mb-6 shadow-2xl shadow-primary/10 relative z-10">
                        {driver.profile_photo ? (
                            <img src={driver.profile_photo} alt="" className="w-full h-full object-cover" />
                        ) : driver.name.charAt(0)}
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">{driver.name}</h2>
                    <p className="text-primary text-[10px] uppercase font-black tracking-[0.2em] mt-2 mb-6">TIYE_CERTIFIED_CHAUFFEUR</p>

                    <div className="flex items-center space-x-1 mb-8">
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${s <= (driver.rating || 0) ? 'text-secondary fill-secondary' : 'text-gray-800'}`} />
                        ))}
                        <span className="text-gray-500 text-sm ml-2 font-black tracking-tighter">{(driver.rating || '0.0')}</span>
                    </div>

                    <div className="w-full space-y-4 text-left border-t border-white/5 pt-8">
                        <div className="flex items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                                <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-bold">{driver.phone}</span>
                        </div>
                        <div className="flex items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                                <Mail className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-bold truncate">{driver.email}</span>
                        </div>
                        <div className="flex items-center p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                                <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-bold">Joined {new Date(driver.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {/* Active Trip Highligth */}
                    {activeTrip && (
                        <div className="glass p-8 rounded-[2rem] border-2 border-primary/30 bg-primary/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="w-32 h-32 text-primary" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-1">Live Active Ride</h3>
                                        <p className="text-xs text-gray-500">Currently serving a platform request.</p>
                                    </div>
                                    <div className="px-3 py-1 bg-primary text-black text-[10px] font-black rounded-lg animate-pulse">
                                        {activeTrip.status.toUpperCase()}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Passenger</p>
                                        <p className="text-xl font-bold">{activeTrip.passenger_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase font-black mb-1">Current Route</p>
                                        <p className="text-sm font-medium line-clamp-1">{activeTrip.pickup_location} <ChevronRight className="w-3 h-3 inline mx-1 opacity-30" /> {activeTrip.destination}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/trips/${activeTrip.id}`)}
                                    className="mt-8 flex items-center text-primary text-[10px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
                                >
                                    TRACK TRIP LOGISTICS <ChevronRight className="w-3 h-3 ml-2" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass p-6 rounded-[2rem] border border-white/5">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Total Revenue</p>
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter text-secondary">K {stats.totalEarnings.toLocaleString()}</h3>
                                <DollarSign className="w-8 h-8 text-secondary opacity-20" />
                            </div>
                        </div>
                        <div className="glass p-6 rounded-[2rem] border border-white/5">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Completed</p>
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter text-green-500">{stats.completedTrips}</h3>
                                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
                            </div>
                        </div>
                        <div className="glass p-6 rounded-[2rem] border border-white/5">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Cancellations</p>
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter text-red-500">{stats.cancelledTrips}</h3>
                                <XCircle className="w-8 h-8 text-red-500 opacity-20" />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="glass p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 p-8 opacity-5">
                            <Car className="w-32 h-32" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-gray-500 border-b border-white/5 pb-4">Vehicle Assets</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Car Model</p>
                                <p className="font-bold text-xl">{driver.car_model || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Colorway</p>
                                <p className="font-bold text-xl">{driver.car_color || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold mb-1 tracking-widest">Registry ID</p>
                                <p className="font-bold text-xl text-primary">{driver.plate_number || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trip History */}
            <div className="glass p-8 rounded-[2rem] border border-white/5">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-bold flex items-center">
                            <TrendingUp className="w-5 h-5 mr-3 text-primary" /> Logistical Archive
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-black tracking-widest">Historical Platform Engagements</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="pb-6">Date Lifecycle</th>
                                <th className="pb-6">Passenger Entity</th>
                                <th className="pb-6">Revenue</th>
                                <th className="pb-6">Status</th>
                                <th className="pb-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {trips.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center text-gray-600 font-bold uppercase tracking-widest text-xs italic">
                                        No platform events logged for this entity.
                                    </td>
                                </tr>
                            ) : trips.map((trip: any) => (
                                <tr key={trip.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-6 whitespace-nowrap">
                                        <p className="font-bold text-sm tracking-tighter">{new Date(trip.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-500 font-black uppercase mt-1">{new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-black mr-4 border border-white/10 shadow-lg shadow-black/20 group-hover:border-primary/20 transition-colors">
                                                {trip.passenger_name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-sm tracking-tight">{trip.passenger_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <span className="font-black text-secondary tracking-tighter text-lg">K {Number(trip.fare).toLocaleString()}</span>
                                    </td>
                                    <td className="py-6">
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center ${trip.status === 'completed' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
                                            }`}>
                                            {trip.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {trip.status}
                                        </div>
                                    </td>
                                    <td className="py-6 text-right">
                                        <button
                                            onClick={() => navigate(`/trips/${trip.id}`)}
                                            className="p-3 bg-white/5 text-gray-500 rounded-xl hover:bg-primary/20 hover:text-primary transition-all active:scale-95 border border-transparent hover:border-primary/20"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DriverProfile;
