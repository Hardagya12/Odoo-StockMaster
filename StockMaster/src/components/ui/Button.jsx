import React from 'react';
import { cn } from '../../lib/utils';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variants = {
        primary: 'bg-neo-pink text-white hover:bg-pink-600',
        secondary: 'bg-neo-blue text-white hover:bg-blue-600',
        accent: 'bg-neo-green text-black hover:bg-green-400',
        outline: 'bg-neo-white text-black hover:bg-gray-100',
        ghost: 'bg-transparent border-transparent shadow-none hover:bg-black/5',
    };

    const sizes = {
        default: 'h-12 px-6 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-12 w-12 p-0',
    };

    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-neo border-3 border-black font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50',
                'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                variant !== 'ghost' && 'shadow-neo hover:-translate-y-1 hover:translate-x-0 hover:shadow-neo-lg',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
});

Button.displayName = 'Button';

export { Button };
