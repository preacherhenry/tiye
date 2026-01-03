import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    ShieldCheck,
    UserPlus,
    Phone,
    Calendar,
    Shield,
    ShieldAlert,
    X,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle
} from 'lucide-react';

interface Admin {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'super_admin';
    is_online: boolean;
    created_at: string;
}

const AdminPanel: React.FC = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin'
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/admin/admins');
            if (res.data.success) {
                setAdmins(res.data.admins);
            }
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/admin/admins', formData);
            if (res.data.success) {
                setShowModal(false);
                setFormData({ name: '', email: '', phone: '', password: '', role: 'admin' });
                fetchAdmins();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create admin');
        }
    };

    const handleUpdateRole = async (id: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'super_admin' : 'admin';
        try {
            await api.post(`/admin/admins/${id}/role`, { role: newRole });
            fetchAdmins();
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center text-gray-400 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="font-bold uppercase tracking-widest text-[10px]">Loading administrator registry...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center">
                        <ShieldCheck className="w-8 h-8 mr-3 text-primary" />
                        Administrator Management
                    </h2>
                    <p className="text-gray-400">Manage platform administrators and access control</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add Administrator
                </button>
            </div>

            {/* Admin List */}
            <div className="glass p-8 rounded-[2rem] border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="pb-6">Administrator</th>
                                <th className="pb-6">Contact</th>
                                <th className="pb-6">Access Level</th>
                                <th className="pb-6">Online Status</th>
                                <th className="pb-6">Registered</th>
                                <th className="pb-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {admins.map((admin) => (
                                <tr key={admin.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-6">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black mr-4 border border-primary/20 shadow-lg shadow-primary/10">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{admin.name}</p>
                                                <p className="text-[10px] text-gray-500 font-black uppercase">{admin.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex items-center text-gray-400 text-sm">
                                            <Phone className="w-3 h-3 mr-2 text-primary" />
                                            {admin.phone}
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <button
                                            onClick={() => handleUpdateRole(admin.id, admin.role)}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center transition-all ${admin.role === 'super_admin'
                                                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                                : 'text-secondary bg-secondary/10 hover:bg-secondary/20'
                                                }`}
                                        >
                                            {admin.role === 'super_admin' ? (
                                                <><Shield className="w-3 h-3 mr-1" /> Super Admin</>
                                            ) : (
                                                <><ShieldAlert className="w-3 h-3 mr-1" /> Admin</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-6">
                                        <div
                                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center ${admin.is_online
                                                ? 'text-green-500 bg-green-500/10'
                                                : 'text-gray-500 bg-gray-500/10'
                                                }`}
                                        >
                                            {admin.is_online ? (
                                                <><CheckCircle2 className="w-3 h-3 mr-1" /> Online</>
                                            ) : (
                                                <><XCircle className="w-3 h-3 mr-1" /> Offline</>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex items-center text-gray-500 text-xs">
                                            <Calendar className="w-3 h-3 mr-2" />
                                            {new Date(admin.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="py-6 text-right">
                                        <div className="text-xs text-gray-500 italic">
                                            Automatic
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass p-8 rounded-[2rem] max-w-md w-full border border-white/10 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-lg transition-all"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <h3 className="text-2xl font-bold mb-6 flex items-center">
                            <UserPlus className="w-6 h-6 mr-3 text-primary" />
                            Add New Administrator
                        </h3>

                        <form onSubmit={handleCreateAdmin} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-all"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4 text-gray-500" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                    Access Level
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>

                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
