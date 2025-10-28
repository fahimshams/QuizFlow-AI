/**
 * Card Component
 */

import { HTMLAttributes } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({
  children,
  hover = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-md p-6',
        hover && 'hover:shadow-lg transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-xl font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
}

