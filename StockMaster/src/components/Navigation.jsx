import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showOperationsMenu, setShowOperationsMenu] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { 
            id: 'operations', 
            label: 'Operations', 
            hasSubmenu: true,
            submenu: [
                { label: 'Receipt', path: '/receipts' },
                { label: 'Delivery', path: '/deliveries' },
                { label: 'Adjustment', path: '/adjustments' }
            ]
        },
        { id: 'stock', label: 'Stock', path: '/stock' },
        { id: 'move-history', label: 'Move History', path: '/move-history' },
        { 
            id: 'settings', 
            label: 'Settings', 
            hasSubmenu: true,
            submenu: [
                { label: 'Warehouse', path: '/warehouses' },
                { label: 'Locations', path: '/locations' }
            ]
        },
    ];

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    const handleNavClick = (item) => {
        if (item.hasSubmenu) {
            if (item.id === 'operations') {
                setShowOperationsMenu(!showOperationsMenu);
                setShowSettingsMenu(false);
            } else if (item.id === 'settings') {
                setShowSettingsMenu(!showSettingsMenu);
                setShowOperationsMenu(false);
            }
        } else {
            navigate(item.path);
            setShowOperationsMenu(false);
            setShowSettingsMenu(false);
        }
    };

    const handleSubmenuClick = (path) => {
        navigate(path);
        setShowOperationsMenu(false);
        setShowSettingsMenu(false);
    };

    return (
        <nav className="bg-neo-white border-b-3 border-black shadow-neo">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 py-4">
                        {navItems.map((item) => (
                            <div key={item.id} className="relative">
                                <button
                                    onClick={() => handleNavClick(item)}
                                    className={`
                                        px-4 py-2 font-black text-lg border-3 border-black rounded-neo
                                        transition-all
                                        ${isActive(item.path)
                                            ? 'bg-neo-pink text-white shadow-neo'
                                            : 'bg-neo-white text-black hover:bg-gray-100 shadow-neo'
                                        }
                                    `}
                                >
                                    {item.label}
                                </button>
                                {item.id === 'operations' && showOperationsMenu && (
                                    <div className="absolute top-full left-0 mt-2 bg-neo-white border-3 border-black rounded-neo shadow-neo-lg z-10 min-w-[200px]">
                                        {item.submenu.map((subItem, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSubmenuClick(subItem.path)}
                                                className="w-full text-left px-4 py-2 font-bold border-b-3 border-black last:border-b-0 hover:bg-gray-100"
                                            >
                                                {idx + 1}. {subItem.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {item.id === 'settings' && showSettingsMenu && (
                                    <div className="absolute top-full left-0 mt-2 bg-neo-white border-3 border-black rounded-neo shadow-neo-lg z-10 min-w-[200px]">
                                        {item.submenu.map((subItem, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSubmenuClick(subItem.path)}
                                                className="w-full text-left px-4 py-2 font-bold border-b-3 border-black last:border-b-0 hover:bg-gray-100"
                                            >
                                                {idx + 1}. {subItem.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;

