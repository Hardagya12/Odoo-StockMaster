import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-neo-white border-3 border-black rounded-neo shadow-neo-lg p-8">
                    <div className="flex justify-between items-center mb-8 border-b-3 border-black pb-4">
                        <div>
                            <h1 className="text-5xl font-black mb-2">DASHBOARD</h1>
                            <p className="text-lg font-bold text-gray-600">Welcome back, {user?.name}!</p>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            LOGOUT
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-neo-pink border-3 border-black rounded-neo shadow-neo p-6 text-white">
                            <h3 className="text-2xl font-black mb-2">PRODUCTS</h3>
                            <p className="text-4xl font-black">0</p>
                        </div>
                        <div className="bg-neo-blue border-3 border-black rounded-neo shadow-neo p-6 text-white">
                            <h3 className="text-2xl font-black mb-2">WAREHOUSES</h3>
                            <p className="text-4xl font-black">0</p>
                        </div>
                        <div className="bg-neo-green border-3 border-black rounded-neo shadow-neo p-6 text-black">
                            <h3 className="text-2xl font-black mb-2">STOCK ITEMS</h3>
                            <p className="text-4xl font-black">0</p>
                        </div>
                    </div>

                    <div className="mt-8 bg-gray-50 border-3 border-black rounded-neo shadow-neo p-6">
                        <h2 className="text-3xl font-black mb-4">User Information</h2>
                        <div className="space-y-2 font-bold">
                            <p><span className="text-gray-600">ID:</span> {user?.id}</p>
                            <p><span className="text-gray-600">Name:</span> {user?.name}</p>
                            <p><span className="text-gray-600">Email:</span> {user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
