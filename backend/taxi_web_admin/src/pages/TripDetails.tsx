import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    ArrowLeft,
    MapPin,
    Clock,
    Banknote,
    XCircle,
    Calendar,
    ChevronRight,
    Activity
} from 'lucide-react';

const TripDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTripDetails();
    }, [id]);

    const fetchTripDetails = async () => {
        try {
            const res = await api.get(`/admin/trips/${id}`);
            if (res.data.success) {
                setTrip(res.data.trip);
            }
        } catch (error) {
            console.error('Fetch trip details error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-20 text-center text-gray-500 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="font-medium">Acquiring trip data...</p>
        </div>
    );

    if (!trip) return (
        <div className="p-20 text-center text-red-500 bg-red-500/5 rounded-[2rem] border border-red-500/10">
            <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold">Trip Not Found</h3>
            <p className="mt-2 opacity-70">The requested trip record does not exist or has been archived.</p>
            <button onClick={() => navigate(-1)} className="mt-6 text-sm font-bold underline">Go Back</button>
        </div>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'accepted':
            case 'arrived':
            case 'picked_up': return 'text-primary bg-primary/10 border-primary/20 animate-pulse';
            default: return 'text-gray-400 bg-gray-400/10 border-white/5';
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-white transition-all group"
            >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Trip Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass p-8 rounded-[2rem] border border-white/5">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter">TRIP #{trip.id.toString().padStart(6, '0')}</h2>
                                <div className="flex items-center text-gray-500 mt-2 font-medium">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>{new Date(trip.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${getStatusColor(trip.status)} whitespace-nowrap`}>
                                {trip.status}
                            </div>
                        </div>

                        {/* Route Timeline */}
                        <div className="relative pl-10 space-y-16 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-1 before:bg-gradient-to-b before:from-primary before:to-secondary before:rounded-full before:opacity-20">
                            <div className="relative">
                                <div className="absolute -left-[35px] top-1 w-7 h-7 bg-surface border-4 border-primary rounded-full z-10 shadow-lg shadow-primary/20"></div>
                                <div>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Pick up Location</p>
                                    <h4 className="text-xl font-bold leading-tight">{trip.pickup_location}</h4>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[35px] top-1 w-7 h-7 bg-surface border-4 border-secondary rounded-full z-10 shadow-lg shadow-secondary/20"></div>
                                <div>
                                    <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1">Destination</p>
                                    <h4 className="text-xl font-bold leading-tight">{trip.destination}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-8 mt-16 pt-10 border-t border-white/5">
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center">
                                    <Banknote className="w-3 h-3 mr-1" /> Fare Total
                                </p>
                                <p className="text-3xl font-black text-secondary">K {Number(trip.fare).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" /> Distance
                                </p>
                                <p className="text-3xl font-black text-primary">{trip.distance} <span className="text-sm">KM</span></p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> Status
                                </p>
                                <p className="text-lg font-bold uppercase tracking-tight opacity-80">{trip.status}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Participants */}
                <div className="space-y-6">
                    {/* Passenger Card */}
                    <div className="glass p-6 rounded-[2rem] border border-white/5 group active:scale-[0.98] transition-all">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-5 border-b border-white/5 pb-3">Passenger Information</h3>
                        <div className="flex items-center">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl text-primary font-black overflow-hidden border border-white/10 mr-4 shadow-xl">
                                {trip.passenger_avatar ? <img src={trip.passenger_avatar} alt="" className="w-full h-full object-cover" /> : trip.passenger_name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-lg font-bold truncate leading-none">{trip.passenger_name}</p>
                                <p className="text-sm text-gray-500 mt-1 font-medium">{trip.passenger_phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Driver Card */}
                    {trip.driver_id ? (
                        <div
                            className="glass p-6 rounded-[2rem] border-l-4 border-l-primary group cursor-pointer hover:bg-primary/5 transition-all active:scale-[0.98]"
                            onClick={() => navigate(`/drivers/${trip.driver_id}`)}
                        >
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-5 border-b border-white/5 pb-3 flex justify-between">
                                Assigned Driver
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </h3>
                            <div className="flex items-center">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl text-primary font-black overflow-hidden border border-primary/20 mr-4 shadow-xl shadow-primary/5 group-hover:border-primary/50 transition-colors">
                                    {trip.driver_avatar ? <img src={trip.driver_avatar} alt="" className="w-full h-full object-cover" /> : trip.driver_name.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-lg font-bold truncate leading-none group-hover:text-primary transition-colors">{trip.driver_name}</p>
                                    <p className="text-sm text-gray-400 mt-1 font-medium">{trip.car_model}</p>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5">{trip.plate_number}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass p-8 rounded-[2rem] border border-dashed border-white/10 text-center">
                            <Activity className="w-8 h-8 mx-auto mb-3 text-gray-700 animate-pulse" />
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Awaiting Assignment</p>
                        </div>
                    )}

                    {/* Technical Metadata */}
                    <div className="glass p-6 rounded-[2rem] bg-surface border border-white/5">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Service Class</span>
                                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">TIYE_CLASS_ECO</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-500">Payment Method</span>
                                <span className="text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">CASH_ON_ARRIVAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TripDetails;
