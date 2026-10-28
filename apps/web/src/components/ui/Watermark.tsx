import React from 'react';
import { SunMark } from './SunMark';

export const Watermark: React.FC = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Kurdish identity radial glow */}
      <div className="absolute inset-0 main-glow-bg" />

      {/* Subtle noise pattern to eliminate banding */}
      <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />

      {/* Large 21-ray rotating sun outline watermark */}
      <div
        className="absolute left-1/2 bottom-[-180px] -translate-x-1/2 flex items-center justify-center pointer-events-none"
        style={{ width: '920px', height: '920px' }}
      >
        <div className="animate-spin-slow origin-center flex items-center justify-center">
          <SunMark variant="watermark" size={900} />
        </div>
      </div>
    </div>
  );
};
