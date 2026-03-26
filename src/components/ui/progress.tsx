'use client';

import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  color,
  size = 'md',
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getDefaultColor = () => {
    if (percentage >= 90) return 'bg-emerald-500';
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const barColor = color || getDefaultColor();

  return (
    <div className={cn('w-full', className)} {...props}>
      {(label || showValue) && (
        <div className="mb-1 flex justify-between text-xs text-gray-400">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div
        className={cn(
          'overflow-hidden rounded-full bg-gray-800',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export { Progress };
export type { ProgressProps };
