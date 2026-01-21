import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    CreditCard,
    Plus,
    Trash2,
    Edit3,
    CheckCircle,
    XCircle,
    Clock,
    Banknote,
    Users,
    ChevronRight,
    Search,
    Filter,
    Activity,
    FileText,
    CheckCircle2,
    Pause,
    Play
} from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    price: number;
    duration_days: number;
    description: string;
    status: 'active' | 'inactive';
}

interface Subscription {
    id: number;
    driver_id: number;
    driver_name: string;
    driver_phone: string;
    plan_name: string;
    price: number;
    duration_days: number;
    screenshot_url: string;
    status: 'pending' | 'active' | 'expired' | 'rejected' | 'paused';
    start_date: string;
    expiry_date: string;
    created_at: string;
}

const Subscriptions: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'plans' | 'verifications' | 'revenue'>('plans');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan> | null>(null);

    useEffect(() => {
        fetchPlans();
        fetchSubscriptions();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/subscriptions/admin/plans');
            if (res.data.success) setPlans(res.data.plans);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            const res = await api.get('/subscriptions/admin/subscriptions');
            if (res.data.success) setSubscriptions(res.data.subscriptions);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentPlan?.id) {
                await api.put('/subscriptions/admin/plans', currentPlan);
            } else {
                await api.post('/subscriptions/admin/plans', currentPlan);
            }
            setShowPlanModal(false);
            fetchPlans();
        } catch (error) {
            console.error('Failed to save plan:', error);
        }
    };

    const handleDeletePlan = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;
        try {
            await api.delete(`/subscriptions/admin/plans/${id}`);
            fetchPlans();
        } catch (error) {
            console.error('Failed to delete plan:', error);
        }
    };

    const handleVerifySubscription = async (id: number, status: 'active' | 'rejected') => {
        if (!window.confirm(`Are you sure you want to mark this as ${status}?`)) return;
        try {
            await api.post('/subscriptions/admin/verify-subscription', { subscription_id: id, status });
            fetchSubscriptions();
        } catch (error) {
            console.error('Failed to verify subscription:', error);
        }
    };

    const StatCard = ({ label, value, icon: Icon, color }: any) => (
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/10 rounded-full -mr-12 -mt-12 blur-2xl`}></div>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${color}/10 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{value}</h3>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</p>
        </div>
    );

    if (loading) return <div className="p-20 text-center text-gray-400">Loading subscription records...</div>;

    const pendingCount = subscriptions.filter(s => s.status === 'pending').length;
    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    const totalRevenue = subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + Number(s.price), 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2 flex items-center">
                        <CreditCard className="w-8 h-8 mr-3 text-primary" />
                        Driver Subscriptions
                    </h2>
                    <p className="text-gray-400">Manage subscription plans and verify driver payments</p>
                </div>
                {activeTab === 'plans' && (
                    <button
                        onClick={() => {
                            setCurrentPlan({ name: '', price: 0, duration_days: 0, description: '', status: 'active' });
                            setShowPlanModal(true);
                        }}
                        className="flex items-center px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Plan
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Pending Verifications" value={pendingCount} icon={Clock} color="primary" />
                <StatCard label="Active Subscriptions" value={activeCount} icon={CheckCircle2} color="green-500" />
                <StatCard label="Total Revenue (K)" value={totalRevenue.toFixed(2)} icon={Banknote} color="purple-500" />
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-white/5 pb-1">
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`px-6 py-3 font-bold text-sm tracking-widest uppercase transition-all relative ${activeTab === 'plans' ? 'text-primary' : 'text-gray-500 hover:text-text'
                        }`}
                >
                    Subscription Plans
                    {activeTab === 'plans' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('verifications')}
                    className={`px-6 py-3 font-bold text-sm tracking-widest uppercase transition-all relative ${activeTab === 'verifications' ? 'text-primary' : 'text-gray-500 hover:text-text'
                        }`}
                >
                    Payment Verifications
                    {pendingCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{pendingCount}</span>
                    )}
                    {activeTab === 'verifications' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'plans' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="glass p-8 rounded-[2rem] border border-white/5 flex flex-col relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-all"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xl font-bold mb-1">{plan.name}</h4>
                                    <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg ${plan.status === 'active' ? 'text-green-500 bg-green-500/10' : 'text-gray-500 bg-gray-500/10'}`}>
                                        {plan.status}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            setCurrentPlan(plan);
                                            setShowPlanModal(true);
                                        }}
                                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-primary"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className="p-2 bg-white/5 rounded-lg hover:bg-red-500/10 transition-all text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-black text-primary">K{plan.price}</span>
                                <span className="text-gray-400 ml-2 font-medium">/{plan.duration_days} days</span>
                            </div>

                            <p className="text-gray-400 text-sm mb-8 flex-1 leading-relaxed">
                                {plan.description}
                            </p>

                            <div className="pt-6 border-t border-white/5 flex items-center text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <Activity className="w-3 h-3 mr-2 text-primary" />
                                {plan.duration_days} Days Accessibility
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass p-8 rounded-[2rem] border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] border-b border-white/5">
                                    <th className="pb-6">Driver</th>
                                    <th className="pb-6">Plan Details</th>
                                    <th className="pb-6">Payment Proof</th>
                                    <th className="pb-6">Status</th>
                                    <th className="pb-6">Submitted</th>
                                    <th className="pb-6 text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {subscriptions.map((sub) => (
                                    <tr key={sub.id} className="group hover:bg-white/[0.01]">
                                        <td className="py-6">
                                            <div>
                                                <p className="font-bold text-sm">{sub.driver_name}</p>
                                                <p className="text-[10px] text-gray-500 font-black uppercase">{sub.driver_phone}</p>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div>
                                                <p className="font-bold text-sm text-primary">{sub.plan_name}</p>
                                                <p className="text-[10px] text-gray-500 font-black tracking-tight">K{sub.price} • {sub.duration_days} Days</p>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <a
                                                href={sub.screenshot_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-xs text-primary hover:underline group/img"
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                View Screenshot
                                            </a>
                                        </td>
                                        <td className="py-6">
                                            <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg ${sub.status === 'active' ? 'text-green-500 bg-green-500/10' :
                                                sub.status === 'paused' ? 'text-amber-500 bg-amber-500/10' :
                                                    sub.status === 'pending' ? 'text-primary bg-primary/10 animate-pulse' :
                                                        sub.status === 'rejected' ? 'text-red-500 bg-red-500/10' :
                                                            'text-gray-500 bg-gray-500/10'
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="py-6 text-xs text-gray-500">
                                            {new Date(sub.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-6 text-right">
                                            {sub.status === 'pending' ? (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleVerifySubscription(sub.id, 'rejected')}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 transition-all hover:text-black"
                                                        title="Reject Payment"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerifySubscription(sub.id, 'active')}
                                                        className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 transition-all hover:text-black"
                                                        title="Approve Subscription"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end space-x-2">
                                                    {(sub.status === 'active' || sub.status === 'paused') && (
                                                        <button
                                                            onClick={async () => {
                                                                const newStatus = sub.status === 'paused' ? 'active' : 'paused';
                                                                if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'Resume' : 'Pause'} this subscription?`)) return;
                                                                await api.put(`/subscriptions/admin/subscriptions/${sub.id}/toggle-pause`, { status: newStatus });
                                                                fetchSubscriptions();
                                                            }}
                                                            className={`p-2 rounded-lg transition-all ${sub.status === 'paused'
                                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-black'
                                                                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black'
                                                                }`}
                                                            title={sub.status === 'paused' ? 'Resume Subscription' : 'Pause Subscription'}
                                                        >
                                                            {sub.status === 'paused' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm('PERMANENT DELETE: Are you sure? This is usually for refunds.')) return;
                                                            await api.delete(`/subscriptions/admin/subscriptions/${sub.id}`);
                                                            fetchSubscriptions();
                                                        }}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 transition-all hover:text-black"
                                                        title="Permanently Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Plan Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass p-10 rounded-[2.5rem] max-w-md w-full border border-white/10 relative">
                        <h3 className="text-2xl font-bold mb-8 flex items-center capitalize">
                            <Plus className="w-6 h-6 mr-3 text-primary" />
                            {currentPlan?.id ? 'Edit Plan' : 'Create Subscription Plan'}
                        </h3>

                        <form onSubmit={handleSavePlan} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Plan Name</label>
                                <input
                                    type="text"
                                    value={currentPlan?.name}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all font-bold"
                                    placeholder="e.g. Weekly Pro"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Price (K)</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.price}
                                        onChange={(e) => setCurrentPlan({ ...currentPlan, price: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Duration (Days)</label>
                                    <input
                                        type="number"
                                        value={currentPlan?.duration_days}
                                        onChange={(e) => setCurrentPlan({ ...currentPlan, duration_days: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all font-bold"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Description</label>
                                <textarea
                                    value={currentPlan?.description}
                                    onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all min-h-[100px]"
                                    placeholder="What's included in this plan?"
                                />
                            </div>
                            {currentPlan?.id && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Status</label>
                                    <select
                                        value={currentPlan?.status}
                                        onChange={(e) => setCurrentPlan({ ...currentPlan, status: e.target.value as any })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all font-bold"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPlanModal(false)}
                                    className="flex-1 px-6 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    {currentPlan?.id ? 'Update Plan' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
