import React from 'react';
import { cn } from '../../lib/utils';

const Badge = ({ status, className }) => {
    const statusConfig = {
        DRAFT: {
            bg: 'bg-gray-200',
            text: 'text-gray-800',
            label: 'Draft'
        },
        WAITING: {
            bg: 'bg-yellow-200',
            text: 'text-yellow-800',
            label: 'Waiting'
        },
        READY: {
            bg: 'bg-blue-200',
            text: 'text-blue-800',
            label: 'Ready'
        },
        DONE: {
            bg: 'bg-green-200',
            text: 'text-green-800',
            label: 'Done'
        },
        CANCELLED: {
            bg: 'bg-red-200',
            text: 'text-red-800',
            label: 'Cancelled'
        }
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
        <span
            className={cn(
                'px-3 py-1 rounded-neo font-bold text-sm border-2 border-black transition-all duration-150 hover:scale-105',
                config.bg,
                config.text,
                className
            )}
        >
            {config.label}
        </span>
    );
};

export default Badge;
