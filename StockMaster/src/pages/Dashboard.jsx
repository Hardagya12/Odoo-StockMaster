import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeNav, setActiveNav] = useState('Dashboard');
    const [showOperationsMenu, setShowOperationsMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { id: 'Dashboard', label: 'Dashboard' },
        { id: 'Operations', label: 'Operations', hasSubmenu: true },
        { id: 'Stock', label: 'Stock' },
        { id: 'Move History', label: 'Move History' },
        { id: 'Settings', label: 'Settings', hasSubmenu: true },
    ];

    const operationsSubmenu = ['Reciept', 'Delivery', 'Adjustment'];
    const settingsSubmenu = ['Warehouse', 'Locations'];

    // Mock data - replace with actual API calls later
    const receiptData = {
        toReceive: 4,
        late: 1,
        operations: 6,
    };

    const deliveryData = {
        toDeliver: 4,
        late: 1,
        waiting: 2,
        operations: 6,
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo-lg p-8">
                    {/* Navigation Bar */}
                    <div className="mb-8 border-b-3 border-black pb-4">
                        <div className="flex items-center justify-between">
                            <nav className="flex items-center gap-4">
                                {navItems.map((item) => (
                                    <div key={item.id} className="relative">
                                        <button
                                            onClick={() => {
                                                setActiveNav(item.id);
                                                if (item.hasSubmenu) {
                                                    setShowOperationsMenu(item.id === 'Operations' ? !showOperationsMenu : false);
                                                }
                                            }}
                                            className={`
                                                px-4 py-2 font-black text-lg border-3 border-black rounded-neo
                                                transition-all
                                                ${activeNav === item.id
                                                    ? 'bg-neo-pink text-white shadow-neo'
                                                    : 'bg-neo-white text-black hover:bg-gray-100 shadow-neo'
                                                }
                                            `}
                                        >
                                            {item.label}
                                        </button>
                                        {item.id === 'Operations' && showOperationsMenu && (
                                            <div className="absolute top-full left-0 mt-2 bg-neo-white border-3 border-black rounded-neo shadow-neo-lg z-10 min-w-[200px]">
                                                {operationsSubmenu.map((subItem, idx) => (
                                                    <div key={idx} className="px-4 py-2 font-bold border-b-3 border-black last:border-b-0">
                                                        {idx + 1}. {subItem}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-3xl font-black">Dashboard</h2>
                                    <div className="w-12 h-12 bg-neo-pink border-3 border-black rounded-neo shadow-neo flex items-center justify-center">
                                        <span className="text-2xl font-black text-white">A</span>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={handleLogout}>
                                    LOGOUT
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Receipt Widget */}
                        <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo p-6">
                            <h3 className="text-3xl font-black mb-6">Reciept</h3>
                            <div className="space-y-4">
                                <Button 
                                    variant="primary" 
                                    className="w-full text-left justify-start"
                                >
                                    {receiptData.toReceive} to receive
                                </Button>
                                <div className="font-bold text-lg space-y-1">
                                    <p>{receiptData.late} Late</p>
                                    <p>{receiptData.operations} operations</p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Widget */}
                        <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo p-6">
                            <h3 className="text-3xl font-black mb-6">Delivery</h3>
                            <div className="space-y-4">
                                <Button 
                                    variant="secondary" 
                                    className="w-full text-left justify-start"
                                >
                                    {deliveryData.toDeliver} to Deliver
                                </Button>
                                <div className="font-bold text-lg space-y-1">
                                    <p>{deliveryData.late} Late</p>
                                    <p>{deliveryData.waiting} waiting</p>
                                    <p>{deliveryData.operations} operations</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-8 bg-neo-offwhite border-3 border-black rounded-neo shadow-neo p-6">
                        <h3 className="text-2xl font-black mb-4">Legend</h3>
                        <div className="space-y-2 font-bold text-lg">
                            <p><span className="text-gray-700">Late:</span> schedule date &lt; today's date</p>
                            <p><span className="text-gray-700">Operations:</span> schedule date &gt; today's date</p>
                            <p><span className="text-gray-700">Waiting:</span> Waiting for the stocks</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
