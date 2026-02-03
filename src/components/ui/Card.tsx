import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  className = '',
  hover = false,
  interactive = false,
  onClick,
  padding = 'none',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        card
        ${paddingClasses[padding]}
        ${hover ? 'card-hover' : ''}
        ${interactive ? 'card-interactive cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
