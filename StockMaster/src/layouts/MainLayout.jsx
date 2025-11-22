import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import ProfileSidebar from '../components/ProfileSidebar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-neo-yellow">
            <div className="flex">
                {/* Profile Sidebar */}
                <ProfileSidebar />
                
                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Navigation */}
                    <Navigation />
                    
                    {/* Page Content */}
                    <main className="flex-1 p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;

