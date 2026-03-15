import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Navigation, Eye, ChevronLeft, ChevronRight, Clock, User, Phone, Car } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';

interface Trip {
    id: string;
    passenger_name: string;
    passenger_phone: string;
    driver_name: string;
    driver_phone: string;
    car_model: string;
    plate_number: string;
    pickup_location: string;
    destination: string;
    created_at: string;
    ended_at?: string;
    status: string;
    fare: number;
}

export default function TripHistory() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTrips = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/trips', {
                params: {
                    page: currentPage,
                    search: searchTerm,
                    status: statusFilter,
                    date: dateFilter,
                    limit: 10
                }
            });
            if (res.data.success) {
                setTrips(res.data.trips);
                setTotalPages(res.data.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch trips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchTrips, 500); // Debounce search
        return () => clearTimeout(timeout);
    }, [currentPage, searchTerm, statusFilter, dateFilter]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            case 'rejected': return 'bg-orange-500/10 text-orange-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold font-display text-text">Trip History</h1>
                    <p className="text-gray-400 mt-1">Review all past and current trip records</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search passengers or drivers..."
                            className="bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all w-64 text-text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <select
                            className="bg-surface border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all text-text appearance-none pr-10"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            className="bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all text-text"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Trip ID / Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Passenger</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Driver / Vehicle</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Route</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Fare</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            <div className="h-4 bg-white/5 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : trips.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No trips found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                trips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-text truncate w-32">#{trip.id.substring(0, 8)}</p>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase">
                                                {format(new Date(trip.created_at), 'MMM dd, hh:mm a')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text">{trip.passenger_name}</p>
                                                    <p className="text-xs text-gray-500">{trip.passenger_phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Car className="w-4 h-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text">{trip.driver_name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500 truncate w-32">{trip.car_model || 'No Vehicle'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-[10px] text-gray-400">
                                                    <MapPin className="w-3 h-3 mr-1 text-emerald-500" />
                                                    <span className="truncate w-40">{trip.pickup_location}</span>
                                                </div>
                                                <div className="flex items-center text-[10px] text-gray-400">
                                                    <Navigation className="w-3 h-3 mr-1 text-red-500" />
                                                    <span className="truncate w-40">{trip.destination}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                                                {trip.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-primary">K{Number(trip.fare).toFixed(2)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => window.location.href = `/trips/${trip.id}`}
                                                className="p-2 bg-white/5 hover:bg-primary hover:text-black rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center space-x-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 border border-white/5 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 border border-white/5 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center">
                <div className="flex items-center bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                    <Clock className="w-4 h-4 text-primary mr-2" />
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Data Retention: 7 Days</p>
                </div>
            </div>
        </div>
    );
}
