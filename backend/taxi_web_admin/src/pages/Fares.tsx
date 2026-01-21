import React, { useState, useEffect } from 'react';
import {
    Settings,
    Map as MapIcon,
    Route as RouteIcon,
    Plus,
    Trash2,
    Edit2,
    Save,
    Check,
    X,
    AlertTriangle,
    Navigation,
    Info
} from 'lucide-react';
import api from '../services/api';

const Fares: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'settings' | 'zones' | 'routes'>('settings');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Normal Settings State
    const [settings, setSettings] = useState<any>({
        base_fare: '20',
        price_per_km: '10',
        price_per_min: '0',
        min_fare: '20',
        distance_unit: 'km',
        surge_multiplier: '1.0',
        surge_enabled: 'false'
    });

    // Zones State
    const [zones, setZones] = useState<any[]>([]);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<any>(null);
    const [zoneForm, setZoneForm] = useState({
        name: '',
        lat: '',
        lng: '',
        radius_km: '',
        status: 'active'
    });

    // Routes State
    const [routes, setRoutes] = useState<any[]>([]);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<any>(null);
    const [routeForm, setRouteForm] = useState({
        name: '',
        pickup_zone_id: '',
        dest_zone_id: '',
        fixed_price: '',
        status: 'active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, zRes, rRes] = await Promise.all([
                api.get('/settings'),
                api.get('/fares/zones'),
                api.get('/fares/fixed-routes')
            ]);

            if (sRes.data.success) {
                // Filter and set only relevant settings
                const relevant = ['base_fare', 'price_per_km', 'price_per_min', 'min_fare', 'distance_unit', 'surge_multiplier', 'surge_enabled'];
                const filteredSettings = { ...settings };
                relevant.forEach(key => {
                    if (sRes.data.settings[key] !== undefined) {
                        filteredSettings[key] = sRes.data.settings[key];
                    }
                });
                setSettings(filteredSettings);
            }
            if (zRes.data.success) setZones(zRes.data.zones);
            if (rRes.data.success) setRoutes(rRes.data.fixedRoutes);

        } catch (error) {
            console.error('Fetch fares error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async () => {
        setSaving(true);
        try {
            await api.put('/settings', { settings });
            alert('Settings updated successfully!');
        } catch (error) {
            alert('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    // Zone Handlers
    const handleSaveZone = async () => {
        try {
            if (editingZone) {
                await api.put(`/fares/zones/${editingZone.id}`, zoneForm);
            } else {
                await api.post('/fares/zones', zoneForm);
            }
            setIsZoneModalOpen(false);
            setEditingZone(null);
            setZoneForm({ name: '', lat: '', lng: '', radius_km: '', status: 'active' });
            fetchData();
        } catch (error) {
            alert('Failed to save zone');
        }
    };

    const handleDeleteZone = async (id: number) => {
        if (!confirm('Are you sure? Routes using this zone might break.')) return;
        try {
            await api.delete(`/fares/zones/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete zone');
        }
    };

    // Route Handlers
    const handleSaveRoute = async () => {
        try {
            if (editingRoute) {
                await api.put(`/fares/fixed-routes/${editingRoute.id}`, routeForm);
            } else {
                await api.post('/fares/fixed-routes', routeForm);
            }
            setIsRouteModalOpen(false);
            setEditingRoute(null);
            setRouteForm({ name: '', pickup_zone_id: '', dest_zone_id: '', fixed_price: '', status: 'active' });
            fetchData();
        } catch (error) {
            alert('Failed to save route');
        }
    };

    const handleDeleteRoute = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/fares/fixed-routes/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete route');
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-400 font-medium">Loading fare configuration...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Fare Management</h2>
                    <p className="text-gray-400">Configure normal pricing, zones, and fixed routes.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-white/5 p-1 rounded-2xl w-fit">
                <TabButton
                    active={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                    icon={Settings}
                    label="Normal Settings"
                />
                <TabButton
                    active={activeTab === 'zones'}
                    onClick={() => setActiveTab('zones')}
                    icon={MapIcon}
                    label="Zones"
                />
                <TabButton
                    active={activeTab === 'routes'}
                    onClick={() => setActiveTab('routes')}
                    icon={RouteIcon}
                    label="Fixed Routes"
                />
            </div>

            {/* Tab Content */}
            <div className="glass rounded-3xl p-8">
                {activeTab === 'settings' && (
                    <div className="space-y-8 max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputField
                                label="Base Fare (Kwacha)"
                                icon="K"
                                value={settings.base_fare}
                                onChange={(v) => setSettings({ ...settings, base_fare: v })}
                            />
                            <InputField
                                label={`Rate Per ${settings.distance_unit === 'km' ? 'Kilometer' : 'Meter'} (K)`}
                                icon={<Navigation className="w-4 h-4" />}
                                value={settings.price_per_km}
                                onChange={(v) => setSettings({ ...settings, price_per_km: v })}
                            />
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Distance Unit</label>
                                <select
                                    value={settings.distance_unit}
                                    onChange={(e) => setSettings({ ...settings, distance_unit: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none hover:bg-white/10 font-bold appearance-none cursor-pointer"
                                >
                                    <option value="km" className="bg-[#1a1a1a]">Kilometers (km)</option>
                                    <option value="m" className="bg-[#1a1a1a]">Meters (m)</option>
                                </select>
                            </div>
                            <InputField
                                label="Price Per Minute (K)"
                                value={settings.price_per_min}
                                onChange={(v) => setSettings({ ...settings, price_per_min: v })}
                            />
                            <InputField
                                label="Minimum Fare (K)"
                                value={settings.min_fare}
                                onChange={(v) => setSettings({ ...settings, min_fare: v })}
                            />
                        </div>

                        <div className="p-6 bg-white/5 rounded-2xl space-y-4 border border-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold flex items-center">
                                        <AlertTriangle className="w-4 h-4 mr-2 text-primary" />
                                        Surge Pricing
                                    </h4>
                                    <p className="text-xs text-gray-500">Apply a multiplier during high demand periods.</p>
                                </div>
                                <Toggle
                                    enabled={settings.surge_enabled === 'true'}
                                    onToggle={() => setSettings({ ...settings, surge_enabled: settings.surge_enabled === 'true' ? 'false' : 'true' })}
                                />
                            </div>
                            {settings.surge_enabled === 'true' && (
                                <InputField
                                    label="Surge Multiplier (x)"
                                    value={settings.surge_multiplier}
                                    onChange={(v) => setSettings({ ...settings, surge_multiplier: v })}
                                />
                            )}
                        </div>

                        <button
                            onClick={handleUpdateSettings}
                            disabled={saving}
                            className="bg-primary text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all flex items-center shadow-lg shadow-primary/20"
                        >
                            {saving ? 'SAVING...' : <><Save className="w-4 h-4 mr-2" /> SAVE SETTINGS</>}
                        </button>
                    </div>
                )}

                {activeTab === 'zones' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Zones Management</h3>
                            <button
                                onClick={() => { setEditingZone(null); setZoneForm({ name: '', lat: '', lng: '', radius_km: '', status: 'active' }); setIsZoneModalOpen(true); }}
                                className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-primary hover:text-black transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> ADD NEW ZONE
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-white/5">
                                        <th className="pb-4 font-black">Zone Name</th>
                                        <th className="pb-4 font-black">Coordinates</th>
                                        <th className="pb-4 font-black">Radius</th>
                                        <th className="pb-4 font-black">Status</th>
                                        <th className="pb-4 font-black text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {zones.map((zone) => (
                                        <tr key={zone.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                            <td className="py-4 font-bold">{zone.name}</td>
                                            <td className="py-4 text-gray-400">{zone.lat}, {zone.lng}</td>
                                            <td className="py-4">{zone.radius_km} km</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${zone.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {zone.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right space-x-2">
                                                <button onClick={() => { setEditingZone(zone); setZoneForm({ name: zone.name, lat: zone.lat.toString(), lng: zone.lng.toString(), radius_km: zone.radius_km.toString(), status: zone.status }); setIsZoneModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-primary transition-all inline-block"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteZone(zone.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-all inline-block"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'routes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Fixed Fare Routes</h3>
                            <button
                                onClick={() => { setEditingRoute(null); setRouteForm({ name: '', pickup_zone_id: '', dest_zone_id: '', fixed_price: '', status: 'active' }); setIsRouteModalOpen(true); }}
                                className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-primary hover:text-black transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> ADD FIXED ROUTE
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-white/5">
                                        <th className="pb-4 font-black">Route Name</th>
                                        <th className="pb-4 font-black">From → To</th>
                                        <th className="pb-4 font-black">Fixed Price</th>
                                        <th className="pb-4 font-black">Status</th>
                                        <th className="pb-4 font-black text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {routes.map((route) => (
                                        <tr key={route.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                            <td className="py-4 font-bold">{route.name}</td>
                                            <td className="py-4 text-gray-400">
                                                <div className="flex items-center">
                                                    <span className="text-white font-medium">{route.pickup_zone_name}</span>
                                                    <Navigation className="w-3 h-3 mx-2 text-primary" />
                                                    <span className="text-white font-medium">{route.dest_zone_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 font-black text-secondary">K {route.fixed_price}</td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${route.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {route.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right space-x-2">
                                                <button onClick={() => { setEditingRoute(route); setRouteForm({ name: route.name, pickup_zone_id: route.pickup_zone_id.toString(), dest_zone_id: route.dest_zone_id.toString(), fixed_price: route.fixed_price.toString(), status: route.status }); setIsRouteModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-lg text-primary transition-all inline-block"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteRoute(route.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-all inline-block"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Zone Modal */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass w-full max-w-md rounded-3xl p-8 border border-white/10 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-2xl font-bold mb-6">{editingZone ? 'Edit Zone' : 'Create New Zone'}</h3>
                        <div className="space-y-4">
                            <InputField label="Zone Name" value={zoneForm.name} onChange={(v) => setZoneForm({ ...zoneForm, name: v })} />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Latitude" value={zoneForm.lat} onChange={(v) => setZoneForm({ ...zoneForm, lat: v })} />
                                <InputField label="Longitude" value={zoneForm.lng} onChange={(v) => setZoneForm({ ...zoneForm, lng: v })} />
                            </div>
                            <InputField label="Radius (KM)" value={zoneForm.radius_km} onChange={(v) => setZoneForm({ ...zoneForm, radius_km: v })} />
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Status</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none"
                                    value={zoneForm.status}
                                    onChange={(e) => setZoneForm({ ...zoneForm, status: e.target.value })}
                                >
                                    <option value="active" className="bg-surface text-white">Active</option>
                                    <option value="inactive" className="bg-surface text-white">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-4 mt-8">
                            <button onClick={() => setIsZoneModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5">CANCEL</button>
                            <button onClick={handleSaveZone} className="flex-1 px-6 py-3 rounded-xl bg-primary text-black font-bold">SAVE ZONE</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Route Modal */}
            {isRouteModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass w-full max-w-md rounded-3xl p-8 border border-white/10 animate-in fade-in zoom-in duration-300">
                        <h3 className="text-2xl font-bold mb-6">{editingRoute ? 'Edit Route' : 'Create Fixed Route'}</h3>
                        <div className="space-y-4">
                            <InputField label="Route Name (e.g. CBD to Airport)" value={routeForm.name} onChange={(v) => setRouteForm({ ...routeForm, name: v })} />
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Pickup Zone</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none"
                                    value={routeForm.pickup_zone_id}
                                    onChange={(e) => setRouteForm({ ...routeForm, pickup_zone_id: e.target.value })}
                                >
                                    <option value="">Select Zone</option>
                                    {zones.map(z => <option key={z.id} value={z.id} className="bg-surface text-white">{z.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Destination Zone</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none"
                                    value={routeForm.dest_zone_id}
                                    onChange={(e) => setRouteForm({ ...routeForm, dest_zone_id: e.target.value })}
                                >
                                    <option value="">Select Zone</option>
                                    {zones.map(z => <option key={z.id} value={z.id} className="bg-surface text-white">{z.name}</option>)}
                                </select>
                            </div>
                            <InputField label="Fixed Price (K)" value={routeForm.fixed_price} onChange={(v) => setRouteForm({ ...routeForm, fixed_price: v })} />
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Status</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none"
                                    value={routeForm.status}
                                    onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                                >
                                    <option value="active" className="bg-surface text-white">Active</option>
                                    <option value="inactive" className="bg-surface text-white">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex space-x-4 mt-8">
                            <button onClick={() => setIsRouteModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5">CANCEL</button>
                            <button onClick={handleSaveRoute} className="flex-1 px-6 py-3 rounded-xl bg-primary text-black font-bold">SAVE ROUTE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// UI Components
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
        <Icon className={`w-4 h-4 mr-2 ${active ? 'text-black' : 'text-primary'}`} />
        {label}
    </button>
);

const InputField = ({ label, value, onChange, icon }: any) => (
    <div>
        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 block">{label}</label>
        <div className="relative">
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary font-bold">
                    {icon}
                </div>
            )}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-white/5 border border-white/10 rounded-xl ${icon ? 'pl-12' : 'px-4'} py-3 text-sm focus:border-primary transition-all outline-none hover:bg-white/10 font-bold`}
            />
        </div>
    </div>
);

const Toggle = ({ enabled, onToggle }: any) => (
    <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-green-500' : 'bg-gray-600'}`}
    >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'right-1' : 'left-1'}`}></div>
    </button>
);

export default Fares;
