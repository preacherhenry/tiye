import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Users,
    Car,
    FileCheck,
    DollarSign,
    TrendingUp,
    PieChart as PieChartIcon,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';

const COLORS = ['#A855F7', '#EAB308', '#22C55E', '#EF4444', '#3B82F6'];

const Analytics: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/admin/analytics');
            if (res.data.success) {
                setData(res.data.stats);
            }
        } catch (error) {
            console.error('Analytics fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-400">Loading platform analytics...</div>;
    if (!data) return <div className="p-20 text-center text-red-500">Failed to load analytics data.</div>;

    const { users, rides, applications, totalRevenue, growthTrend } = data;

    const userDistribution = [
        { name: 'Passengers', value: users.passengers },
        { name: 'Drivers', value: users.drivers },
        { name: 'Admins', value: users.admins },
    ].filter(item => item.value > 0);

    const rideStatusData = [
        { name: 'Completed', value: rides.completed },
        { name: 'Cancelled', value: rides.cancelled },
        { name: 'Pending', value: rides.pending },
    ].filter(item => item.value > 0);

    const StatCard = ({ label, value, subtext, icon: Icon, color, trend }: any) => (
        <div className="glass p-6 rounded-3xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-${color}/10 transition-all`}></div>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${color}/10 rounded-2xl`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-bold mb-1">{value}</h3>
            <p className="text-xs text-gray-500 uppercase font-black tracking-widest">{label}</p>
            {subtext && <p className="text-[10px] text-gray-600 mt-2 font-medium">{subtext}</p>}
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-bold mb-2">Platform Analytics</h2>
                <p className="text-gray-400">Live data and insights across Tiye operations.</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Users" value={users.total} icon={Users} color="primary" trend={12} />
                <StatCard label="Completed Rides" value={rides.completed} icon={Car} color="green-500" trend={8} />
                <StatCard label="Platform Revenue" value={`K ${totalRevenue.toLocaleString()}`} icon={DollarSign} color="secondary" subtext="Net revenue from completed rides" />
                <StatCard label="Pending Apps" value={applications.pending} icon={FileCheck} color="blue-500" subtext="Awaiting admin review" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Trend */}
                <div className="lg:col-span-2 glass p-8 rounded-[2rem] min-h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold">Ride Volume Trend</h3>
                            <p className="text-sm text-gray-500">Daily ride requests for the last 7 days</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#4b5563"
                                    fontSize={10}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                                />
                                <YAxis stroke="#4b5563" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                    itemStyle={{ color: '#A855F7' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#A855F7"
                                    strokeWidth={3}
                                    dot={{ fill: '#A855F7', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distributions */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="glass p-8 rounded-[2rem]">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <PieChartIcon className="w-4 h-4 mr-2 text-primary" /> User Distribution
                        </h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={userDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {userDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2rem]">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-primary" /> Ride Outcomes
                        </h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={rideStatusData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={10} width={80} />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="value" fill="#EAB308" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
