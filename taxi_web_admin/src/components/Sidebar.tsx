import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart3,
    Users,
    FileCheck,
    Settings,
    LogOut,
    ShieldCheck,
    LayoutDashboard,
    XCircle,
    User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
    const { logout, user } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/' },
        { icon: FileCheck, label: 'Applications', path: '/applications' },
        { icon: XCircle, label: 'Rejected', path: '/rejected' },
        { icon: Users, label: 'Drivers', path: '/drivers' },
        { icon: User, label: 'Passengers', path: '/passengers' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ];

    if (user?.role === 'super_admin') {
        navItems.push({ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' });
    }

    navItems.push({ icon: Settings, label: 'Settings', path: '/settings' });

    return (
        <div className="w-64 h-screen bg-surface border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-black font-black text-xl">T</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">Tiye Admin</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                                ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-text'}
            `}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="bg-white/5 rounded-2xl p-4 mb-4">
                    <div className="flex items-center space-x-3 mb-1">
                        <div className="w-8 h-8 bg-surface border border-white/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden">
                            {user?.profile_photo ? (
                                <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user?.name.charAt(0)
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-[10px] text-primary uppercase font-black">{user?.role}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
