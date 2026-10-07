import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className, id, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
        const errorId = useId();

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={selectId} className="block text-sm font-medium text-dark-200">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'w-full min-h-11 bg-dark-900 border-2 border-edge rounded-xl px-4 py-2.5 text-sm text-dark-50',
                        'focus:border-edge focus:shadow-[3px_3px_0_0_var(--color-accent-400)] transition-[box-shadow] duration-150 appearance-none cursor-pointer',
                        error && 'border-danger-500 focus:border-danger-500',
                        className
                    )}
                    {...props}
                    aria-invalid={error ? true : props['aria-invalid']}
                    aria-describedby={error ? [props['aria-describedby'], errorId].filter(Boolean).join(' ') : props['aria-describedby']}
                >
                    {placeholder && (
                        <option value="" className="text-dark-500 bg-dark-900">
                            {placeholder}
                        </option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-dark-900">
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p id={errorId} role="alert" className="text-xs text-danger-500 mt-1">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
