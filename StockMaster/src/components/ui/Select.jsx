import React from 'react';
import { cn } from '../../lib/utils';

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <select
            ref={ref}
            className={cn(
                'flex h-12 w-full rounded-neo border-3 border-black bg-neo-white px-4 py-2 font-bold',
                'focus:outline-none focus:ring-2 focus:ring-black',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
});

Select.displayName = 'Select';

export default Select;

