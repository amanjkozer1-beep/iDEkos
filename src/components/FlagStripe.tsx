import React from 'react';

interface FlagStripeProps {
  height?: number | string;
  className?: string;
  hairline?: boolean;
}

export const FlagStripe: React.FC<FlagStripeProps> = ({
  height = 4,
  className = '',
  hairline = false,
}) => {
  return (
    <div
      className={`w-full flex shrink-0 overflow-hidden select-none pointer-events-none ${className}`}
      style={{ height: hairline ? '1.5px' : height }}
      aria-hidden="true"
    >
      <div className="flex-1 bg-[#ED2024] transition-colors" />
      <div className="flex-1 bg-[#FFFFFF] transition-colors" />
      <div className="flex-1 bg-[#278E43] transition-colors" />
    </div>
  );
};
