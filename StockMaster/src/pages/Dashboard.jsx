import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { dashboardService } from '../services/api';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardStats();
    }, []);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserInitial = () => {
        if (user?.name && user.name.length > 0) {
            return user.name.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const receiptData = stats?.receipts || {
        toReceive: 0,
        late: 0,
        operations: 0,
    };

    const deliveryData = stats?.deliveries || {
        toDeliver: 0,
        late: 0,
        waiting: 0,
        operations: 0,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-2xl font-black">LOADING...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo-lg p-8">
                <div className="mb-8 border-b-3 border-black pb-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-black">Dashboard</h2>
                        <div className="w-12 h-12 flex-shrink-0 aspect-square bg-neo-pink rounded-full shadow-neo flex items-center justify-center">
                            <span className="text-2xl font-black text-white">{getUserInitial()}</span>
                        </div>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div 
                        className="bg-neo-pink border-3 border-black rounded-neo shadow-neo p-4 text-white cursor-pointer transition-transform hover:scale-105"
                        onClick={() => navigate('/products')}
                    >
                        <h3 className="text-xl font-black mb-2">Total Products</h3>
                        <p className="text-4xl font-black">{stats?.totalProducts || 0}</p>
                    </div>
                    <div className="bg-neo-blue border-3 border-black rounded-neo shadow-neo p-4 text-white">
                        <h3 className="text-xl font-black mb-2">Low Stock</h3>
                        <p className="text-4xl font-black">{stats?.lowStockCount || 0}</p>
                    </div>
                    <div className="bg-red-500 border-3 border-black rounded-neo shadow-neo p-4 text-white">
                        <h3 className="text-xl font-black mb-2">Out of Stock</h3>
                        <p className="text-4xl font-black">{stats?.outOfStockCount || 0}</p>
                    </div>
                    <div className="bg-neo-green border-3 border-black rounded-neo shadow-neo p-4 text-black">
                        <h3 className="text-xl font-black mb-2">Scheduled Transfers</h3>
                        <p className="text-4xl font-black">{stats?.scheduledTransfers || 0}</p>
                    </div>
                </div>

                {/* Dashboard Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Receipt Widget */}
                    <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo p-6">
                        <h3 className="text-3xl font-black mb-6">Receipt</h3>
                        <div className="space-y-4">
                            <Button 
                                variant="primary" 
                                className="w-full text-left justify-start"
                                onClick={() => navigate('/receipts')}
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
                                onClick={() => navigate('/deliveries')}
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
            </div>
        </div>
    );
};

export default Dashboard;
