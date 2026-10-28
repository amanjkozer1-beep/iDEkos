import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className="relative flex items-center w-full">
      {icon && <span className="absolute left-3 text-[#8F968F] pointer-events-none">{icon}</span>}
      <input
        className={`w-full bg-[#141A16] border border-white/10 rounded-xl py-2 text-sm text-[#F5F4EF] placeholder-[#8F968F] outline-none focus:border-[#FED100]/60 transition-colors ${
          icon ? 'pl-9 pr-3' : 'px-3'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
