import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none gap-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#FED100] text-black hover:bg-[#FED100]/90 active:scale-[0.98]',
    secondary: 'bg-[#222A25] text-white hover:bg-white/10 border border-white/10 active:scale-[0.98]',
    ghost: 'bg-transparent text-[#8F968F] hover:text-white hover:bg-white/5 active:scale-[0.98]',
    danger: 'bg-[#ED2024]/20 text-[#FF5F57] hover:bg-[#ED2024]/30 border border-[#ED2024]/30 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
