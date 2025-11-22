import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';

const Modal = ({ isOpen, onClose, title, children, className }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className={cn(
                    'bg-neo-white border-3 border-black rounded-neo shadow-neo-lg p-6',
                    className
                )}>
                    {title && (
                        <div className="flex items-center justify-between mb-4 border-b-3 border-black pb-4">
                            <h2 className="text-3xl font-black">{title}</h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center border-3 border-black rounded-neo shadow-neo hover:bg-gray-100 font-black"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;

