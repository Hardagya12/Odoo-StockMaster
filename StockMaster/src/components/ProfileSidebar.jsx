import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileSidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileClick = () => {
        navigate('/profile');
        setShowMenu(false);
    };

    return (
        <div className="w-64 bg-neo-white border-r-3 border-black shadow-neo min-h-screen">
            <div className="p-6 border-b-3 border-black">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 flex-shrink-0 aspect-square bg-neo-pink rounded-full shadow-neo flex items-center justify-center">
                        <span className="text-xl font-black text-white">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-black text-lg">{user?.name || 'User'}</h3>
                        <p className="text-sm font-bold text-gray-600">{user?.email}</p>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-3 font-bold border-3 border-black rounded-neo shadow-neo hover:bg-gray-100 mb-3"
                >
                    My Profile
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 font-bold border-3 border-black rounded-neo shadow-neo hover:bg-gray-100 bg-neo-pink text-white"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default ProfileSidebar;

