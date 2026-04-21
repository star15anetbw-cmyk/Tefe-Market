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
}

export default function Input(props: InputProps) {
  const { label, error, className, ...rest } = props;
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 placeholder:text-gray-300 text-sm',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/5',
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-[10px] uppercase font-black tracking-widest text-red-500">{error}</p>}
    </div>
  );
}
