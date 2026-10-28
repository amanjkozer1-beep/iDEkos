import React, { useMemo } from 'react';
import { calculateSunRays } from '../utils/sunGeometry';

export interface SunMarkProps {
  variant?: 'icon' | 'wordmark' | 'monochrome' | 'watermark' | 'small' | 'inline-sun';
  size?: number;
  className?: string;
  showTagline?: boolean;
}

export const SunMark: React.FC<SunMarkProps> = ({
  variant = 'icon',
  size = 32,
  className = '',
  showTagline = false,
}) => {
  // Generate rays for standard 100x100 coordinate box
  const rays = useMemo(() => {
    return calculateSunRays({
      cx: 50,
      cy: 50,
      innerRadius: 24,
      outerRadius: 46,
      discRadius: 21,
      ringRadius: 23,
      raySpreadRatio: 0.38,
    });
  }, []);

  // Large stroke-only watermark variant (~900px, 4-5% opacity, stroke 1.5px)
  if (variant === 'watermark') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size || 900}
        height={size || 900}
        className={`pointer-events-none select-none text-white ${className}`}
        style={{ opacity: 0.045 }}
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx="50"
          cy="50"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        {rays.map((ray) => (
          <path
            key={ray.index}
            d={ray.pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    );
  }

  // Small subtle watermark variant (24px, 12% opacity)
  if (variant === 'small') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size || 24}
        height={size || 24}
        className={`pointer-events-none select-none text-[#FED100] ${className}`}
        style={{ opacity: 0.16 }}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="21" fill="currentColor" />
        <circle
          cx="50"
          cy="50"
          r="23.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {rays.map((ray) => (
          <path key={ray.index} d={ray.pathData} fill="currentColor" />
        ))}
      </svg>
    );
  }

  // Pure inline sun for inside text
  if (variant === 'inline-sun') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={`inline-block shrink-0 ${className}`}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="21" fill="#FED100" />
        <circle
          cx="50"
          cy="50"
          r="23.8"
          fill="none"
          stroke="#FED100"
          strokeWidth="1.6"
        />
        {rays.map((ray) => (
          <path key={ray.index} d={ray.pathData} fill="#FED100" />
        ))}
      </svg>
    );
  }

  // Wordmark variant matching screenshot brand row:
  // K.O.S sun logo (32px) + wordmark "K.O.S" (34px, weight 500, white)
  if (variant === 'wordmark') {
    return (
      <div className={`flex flex-col select-none ${className}`}>
        <div className="flex items-center gap-3 leading-none">
          {/* K.O.S Sun Logo (32px) with golden disc + 21 rays */}
          <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            className="drop-shadow-[0_0_12px_rgba(254,209,0,0.4)] shrink-0"
            aria-label="K.O.S 21-ray golden sun emblem"
          >
            <circle cx="50" cy="50" r="21" fill="#FED100" />
            <circle
              cx="50"
              cy="50"
              r="23.8"
              fill="none"
              stroke="#FED100"
              strokeWidth="1.5"
              opacity="0.9"
            />
            {rays.map((ray) => (
              <path key={ray.index} d={ray.pathData} fill="#FED100" />
            ))}
          </svg>

          {/* Clean geometric sans wordmark "K.O.S" in white */}
          <span className="text-[#F5F4EF] font-medium tracking-normal text-[26px] sm:text-[30px] font-sans">
            K.O.S
          </span>
        </div>

        {showTagline && (
          <span className="text-[11px] uppercase tracking-[1.5px] text-[#8F968F] mt-1 font-normal pl-0.5">
            Kozer Operating System
          </span>
        )}
      </div>
    );
  }

  // Monochrome white variant
  if (variant === 'monochrome') {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={`shrink-0 text-white ${className}`}
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="21" fill="currentColor" />
        <circle
          cx="50"
          cy="50"
          r="23.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {rays.map((ray) => (
          <path key={ray.index} d={ray.pathData} fill="currentColor" />
        ))}
      </svg>
    );
  }

  // Default: Golden icon variant
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 drop-shadow-[0_0_8px_rgba(254,209,0,0.35)] ${className}`}
      aria-label="K.O.S 21-ray golden sun"
    >
      <circle cx="50" cy="50" r="21" fill="#FED100" />
      <circle
        cx="50"
        cy="50"
        r="23.8"
        fill="none"
        stroke="#FED100"
        strokeWidth="1.5"
        opacity="0.9"
      />
      {rays.map((ray) => (
        <path key={ray.index} d={ray.pathData} fill="#FED100" />
      ))}
    </svg>
  );
};
