import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    User as UserIcon,
    Mail,
    Phone,
    Lock,
    Save,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Upload,
    Camera,
    Clock,
    Monitor,
    Moon,
    Sun
} from 'lucide-react';

interface LoginHistoryItem {
    id: number;
    ip_address: string;
    user_agent: string;
    login_time: string;
}

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name,
                email: user.email,
                phone: user.phone || ''
            });
            setAvatarPreview(user.profile_photo || null);
        }
        fetchLoginHistory();

        // Load theme from localStorage
        const savedTheme = localStorage.getItem('admin_theme') as 'dark' | 'light' || 'dark';
        setTheme(savedTheme);
        document.documentElement.classList.toggle('light', savedTheme === 'light');
    }, [user]);

    const fetchLoginHistory = async () => {
        try {
            const res = await api.get('/admin/login-history');
            if (res.data.success) {
                setLoginHistory(res.data.history);
            }
        } catch (error) {
            console.error('Failed to fetch login history:', error);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const res = await api.put('/admin/profile', profileData);
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                const updatedUser = { ...user, ...res.data.user };
                localStorage.setItem('admin_user', JSON.stringify(updatedUser));
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }

        try {
            const res = await api.post('/admin/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            if (res.data.success) {
                setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setPasswordMessage(null), 3000);
            }
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const res = await api.post('/admin/profile-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setAvatarPreview(res.data.photoUrl);
                const updatedUser = { ...user, profile_photo: res.data.photoUrl };
                localStorage.setItem('admin_user', JSON.stringify(updatedUser));
                setMessage({ type: 'success', text: 'Profile photo updated!' });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to upload photo' });
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('admin_theme', newTheme);
        document.documentElement.classList.toggle('light', newTheme === 'light');
    };

    const getBrowserName = (userAgent: string) => {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown Browser';
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold mb-2">Settings</h2>
                <p className="text-gray-400">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Picture */}
                <div className="glass p-8 rounded-[2rem] border border-white/5 flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-6 flex items-center self-start">
                        <Camera className="w-5 h-5 mr-3 text-primary" />
                        Profile Picture
                    </h3>

                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-black border-4 border-primary/20 overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name.charAt(0)
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-3 bg-primary text-black rounded-full hover:bg-primary/90 transition-all shadow-lg"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Click the upload button to change your profile picture
                    </p>
                </div>

                {/* Profile Information */}
                <div className="glass p-8 rounded-[2rem] border border-white/5 lg:col-span-2">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                        <UserIcon className="w-5 h-5 mr-3 text-primary" />
                        Profile Information
                    </h3>

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`flex items-center p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                {message.type === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 mr-3" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 mr-3" />
                                )}
                                <span className="text-sm font-medium">{message.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Security / Password */}
                <div className="glass p-8 rounded-[2rem] border border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                        <Lock className="w-5 h-5 mr-3 text-primary" />
                        Security
                    </h3>

                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-all"
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-all"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-primary transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg transition-all"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {passwordMessage && (
                            <div className={`flex items-center p-4 rounded-xl ${passwordMessage.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                {passwordMessage.type === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 mr-3" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 mr-3" />
                                )}
                                <span className="text-sm font-medium">{passwordMessage.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
                        >
                            <Lock className="w-5 h-5 mr-2" />
                            Change Password
                        </button>
                    </form>
                </div>

                {/* Appearance */}
                <div className="glass p-8 rounded-[2rem] border border-white/5">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                        {theme === 'dark' ? <Moon className="w-5 h-5 mr-3 text-primary" /> : <Sun className="w-5 h-5 mr-3 text-primary" />}
                        Appearance
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
                                Theme
                            </label>
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-center">
                                    {theme === 'dark' ? (
                                        <>
                                            <Moon className="w-5 h-5 mr-3 text-primary" />
                                            <span className="font-bold">Dark Mode</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sun className="w-5 h-5 mr-3 text-primary" />
                                            <span className="font-bold">Light Mode</span>
                                        </>
                                    )}
                                </div>
                                <div className={`w-12 h-6 rounded-full transition-all ${theme === 'dark' ? 'bg-primary' : 'bg-gray-400'} relative`}>
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`}></div>
                                </div>
                            </button>
                        </div>

                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-sm text-blue-400">
                                <strong>Note:</strong> Theme preference is saved locally and will persist across sessions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Activity */}
            <div className="glass p-8 rounded-[2rem] border border-white/5">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-primary" />
                    Login Activity
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="pb-4">Time</th>
                                <th className="pb-4">IP Address</th>
                                <th className="pb-4">Device</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loginHistory.length > 0 ? (
                                loginHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center text-sm">
                                                <Clock className="w-4 h-4 mr-2 text-primary" />
                                                {new Date(item.login_time).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-gray-400">{item.ip_address}</td>
                                        <td className="py-4">
                                            <div className="flex items-center text-sm text-gray-400">
                                                <Monitor className="w-4 h-4 mr-2" />
                                                {getBrowserName(item.user_agent)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="py-8 text-center text-gray-500">
                                        No login history available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Account Info */}
            <div className="glass p-8 rounded-[2rem] border border-white/5">
                <h3 className="text-xl font-bold mb-6">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2">Role</p>
                        <p className="font-bold text-lg">
                            <span className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wider ${user?.role === 'super_admin' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                }`}>
                                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2">User ID</p>
                        <p className="font-bold text-lg text-gray-400">#{user?.id}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2">Status</p>
                        <p className="font-bold text-lg">
                            <span className="px-3 py-1 rounded-lg text-xs uppercase tracking-wider bg-green-500/10 text-green-500">
                                Active
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
