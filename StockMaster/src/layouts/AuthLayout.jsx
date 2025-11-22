import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-neo-pink rounded-full border-3 border-black shadow-neo-lg animate-bounce duration-[3000ms]"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-neo-blue rotate-12 border-3 border-black shadow-neo-lg"></div>
            <div className="absolute top-1/2 left-20 w-24 h-24 bg-neo-green -rotate-45 border-3 border-black shadow-neo"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="mb-8 text-center">
                    <h1 className="text-5xl font-black mb-2 bg-neo-white inline-block px-4 py-2 border-3 border-black shadow-neo rotate-[-2deg]">
                        STOCK MASTER
                    </h1>
                    {subtitle && (
                        <p className="mt-4 text-lg font-bold bg-neo-black text-neo-white inline-block px-3 py-1 rotate-[1deg]">
                            {subtitle}
                        </p>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
