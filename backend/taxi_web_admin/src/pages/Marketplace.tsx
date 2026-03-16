import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, ImageIcon, ArrowRight } from 'lucide-react';

const MarketplaceHub: React.FC = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: 'Advertising Posters',
            description: 'Manage the 8 main advertising slots (P1, P2, A1-A6) visible to passengers.',
            icon: ShoppingBag,
            path: '/posters',
            color: 'bg-primary'
        },
        {
            title: 'Store Partners',
            description: 'Manage businesses and stores that can sell items on the platform.',
            icon: Store,
            path: '/stores',
            color: 'bg-blue-500'
        },
        {
            title: 'Product Inventory',
            description: 'Manage individual items, pricing, and stock levels for each store.',
            icon: ImageIcon,
            path: '/inventory',
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">Marketplace Management</h2>
                <p className="text-gray-400">Central hub for managing advertisements and partner commerce.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {sections.map((section) => (
                    <div 
                        key={section.path}
                        onClick={() => navigate(section.path)}
                        className="glass p-8 rounded-[2.5rem] border border-white/5 group hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 ${section.color}/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:${section.color}/10 transition-all`}></div>
                        
                        <div className={`w-14 h-14 ${section.color}/10 rounded-2xl flex items-center justify-center mb-6 border border-white/5`}>
                            <section.icon className={`w-7 h-7 ${section.color.replace('bg-', 'text-')}`} />
                        </div>

                        <h3 className="text-xl font-bold mb-3">{section.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            {section.description}
                        </p>

                        <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary group-hover:translate-x-1 transition-transform">
                            <span>Manage Section</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Stats Summary */}
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div>
                        <h4 className="font-bold text-lg mb-1">Ecosystem Status</h4>
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Live Marketplace Monitoring</p>
                    </div>
                    <div className="flex space-x-12">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Ads Active</p>
                            <p className="text-2xl font-black text-primary">8 / 8</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Stores</p>
                            <p className="text-2xl font-black">Connected</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Catalog Status</p>
                            <p className="text-2xl font-black">Verified</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default MarketplaceHub;
