import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle
} from 'lucide-react';

interface ApplicationsProps {
    status?: 'pending' | 'rejected' | 'all';
}

const Applications: React.FC<ApplicationsProps> = ({ status = 'pending' }) => {
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchApplications();
    }, [status]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const endpoint = status === 'rejected' ? '/admin/rejected' : '/admin/applications';
            const res = await api.get(endpoint);
            if (res.data.success) {
                setApps(res.data.applications);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredApps = apps.filter(app =>
        app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="flex items-center space-x-1 text-primary bg-primary/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><Clock className="w-3 h-3" /> <span>Pending</span></span>;
            case 'resubmitted': return <span className="flex items-center space-x-1 text-secondary bg-secondary/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> <span>Resubmitted</span></span>;
            case 'approved': return <span className="flex items-center space-x-1 text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><CheckCircle className="w-3 h-3" /> <span>Approved</span></span>;
            case 'rejected': return <span className="flex items-center space-x-1 text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"><XCircle className="w-3 h-3" /> <span>Rejected</span></span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold mb-2">
                        {status === 'rejected' ? 'Rejected Applications' : 'Driver Applications'}
                    </h2>
                    <p className="text-gray-400">
                        {status === 'rejected' ? 'History of declined driver candidates.' : 'Review and verify new driver candidates.'}
                    </p>
                </div>

                <div className="flex space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="bg-surface border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="bg-surface border border-white/5 p-2 rounded-xl hover:bg-white/5 transition-all text-gray-400">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-white/5">
                        <tr>
                            <th className="px-8 py-5">Driver</th>
                            <th className="px-8 py-5">Vehicle</th>
                            <th className="px-8 py-5">EXP</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Date</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-20 text-gray-500">Loading applications...</td></tr>
                        ) : filteredApps.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-20 text-gray-500">No applications found.</td></tr>
                        ) : filteredApps.map((app) => (
                            <tr key={app.id} className="hover:bg-white/5 transition-all group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
                                            {app.user_avatar ? <img src={app.user_avatar} alt="" className="w-full h-full object-cover" /> : (app.full_name ? app.full_name.charAt(0) : '?')}
                                        </div>
                                        <div>
                                            <p className="font-bold">{app.full_name}</p>
                                            <p className="text-xs text-gray-500">{app.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="font-medium text-sm">{app.vehicle_type}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">{app.vehicle_registration_number}</p>
                                </td>
                                <td className="px-8 py-5 font-mono text-sm text-primary">{app.driving_experience_years}y</td>
                                <td className="px-8 py-5">{getStatusBadge(app.status)}</td>
                                <td className="px-8 py-5 text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => navigate(`/applications/${app.id}`)}
                                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-black transition-all"
                                    >
                                        <Eye className="w-4 h-4" />
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

export default Applications;
