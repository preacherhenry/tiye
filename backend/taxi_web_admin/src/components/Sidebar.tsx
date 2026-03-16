import React, { useState, useEffect } from 'react'; // icon fix v2
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
    User,
    Tag,
    CreditCard,
    Map,
    MapPin,
    MessageSquare,
    Crosshair,
    History,
    ShoppingBag,
    Store,
    Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import { hasPermission } from '../utils/rbac';

const Sidebar: React.FC = () => {
    const { logout, user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        
        const fetchUnread = async () => {
            try {
                const res = await api.get('/messages/unread-count');
                if (res.data.success) setUnreadCount(res.data.count);
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user]);

    const navItems = React.useMemo(() => {
        const items = [
            { icon: LayoutDashboard, label: 'Overview', path: '/' },
            { icon: MessageSquare, label: 'Messages', path: '/messages', badge: unreadCount },
        ];

        if (hasPermission(user?.role, 'driver:manage')) {
            items.push({ icon: Users, label: 'Drivers', path: '/drivers' });
            items.push({ icon: FileCheck, label: 'Applications', path: '/applications' });
            items.push({ icon: XCircle, label: 'Rejected', path: '/rejected' });
        }

        if (hasPermission(user?.role, 'ride:monitor')) {
            items.push({ icon: Crosshair, label: 'Security Map', path: '/security-map' });
            items.push({ icon: History, label: 'Trip History', path: '/trip-history' });
            items.push({ icon: User, label: 'Passengers', path: '/passengers' });
        }

        if (hasPermission(user?.role, 'finance:dashboard')) {
            items.push({ icon: BarChart3, label: 'Analytics', path: '/analytics' });
        }

        if (hasPermission(user?.role, 'finance:approve')) {
            items.push({ icon: CreditCard, label: 'Wallet Approvals', path: '/wallet-approvals' });
        }

        if (hasPermission(user?.role, 'financial:manage')) {
            items.push({ icon: ShieldCheck, label: 'Financial Settings', path: '/financial-settings' });
        }

        if (hasPermission(user?.role, 'report:view_all')) {
            items.push({ icon: Map, label: 'Fares', path: '/fares' });
            items.push({ icon: Tag, label: 'Promotions', path: '/promotions' });
            items.push({ icon: MapPin, label: 'Places', path: '/places' });
        }

        if (hasPermission(user?.role, 'user:manage')) {
            items.push({ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' });
        }

        if (hasPermission(user?.role, 'marketplace:manage')) {
            items.push({ icon: ShoppingBag, label: 'Posters', path: '/posters' });
            items.push({ icon: Store, label: 'Stores', path: '/stores' });
            items.push({ icon: ImageIcon, label: 'Inventory', path: '/inventory' });
        }

        items.push({ icon: Settings, label: 'Settings', path: '/settings' });
        return items;
    }, [user, unreadCount]);

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
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <item.icon className="w-5 h-5" />
                                    {(item as any).badge > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                                    )}
                                </div>
                                <span className="flex-1">{item.label}</span>
                                {(item as any).badge > 0 && (
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                        isActive ? 'bg-black/20 text-black' : 'bg-primary/20 text-primary'
                                    }`}>
                                        {(item as any).badge}
                                    </span>
                                )}
                            </>
                        )}
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
