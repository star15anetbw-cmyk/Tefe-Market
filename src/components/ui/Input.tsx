import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string | number | string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  autoComplete?: string;
  minLength?: number;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export default function Input(props: InputProps) {
  const { label, error, className, icon, ...rest } = props;
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 placeholder:text-gray-400 text-sm font-medium',
            icon ? 'pl-11 pr-4 py-3.5' : 'px-4 py-3.5',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/5',
            className
          )}
          {...rest}
        />
      </div>
      {error && <p className="mt-1 text-[10px] uppercase font-black tracking-widest text-red-500">{error}</p>}
    </div>
  );
}
