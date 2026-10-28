import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export const TrafficLights: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { toggleWindowExpanded, resetToNewChat } = useAppStore();

  return (
    <div
      className="flex items-center gap-[12px] group py-1 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="group"
      aria-label="Window control buttons"
    >
      {/* Close button: red #FF5F57 */}
      <button
        onClick={resetToNewChat}
        className="w-[14px] h-[14px] rounded-full bg-[#FF5F57] hover:brightness-90 active:brightness-75 transition-all flex items-center justify-center cursor-pointer border border-[rgba(0,0,0,0.15)] shadow-xs"
        aria-label="Close window or reset session"
        title="Reset session"
      >
        {isHovered && (
          <svg className="w-2 h-2 text-[#4c0002]" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {/* Minimize button: yellow #FEBC2E */}
      <button
        onClick={() => {}}
        className="w-[14px] h-[14px] rounded-full bg-[#FEBC2E] hover:brightness-90 active:brightness-75 transition-all flex items-center justify-center cursor-pointer border border-[rgba(0,0,0,0.15)] shadow-xs"
        aria-label="Minimize window"
        title="Minimize window"
      >
        {isHovered && (
          <svg className="w-2 h-2 text-[#5e3d00]" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        )}
      </button>

      {/* Zoom / Fullscreen button: green #28C840 */}
      <button
        onClick={toggleWindowExpanded}
        className="w-[14px] h-[14px] rounded-full bg-[#28C840] hover:brightness-90 active:brightness-75 transition-all flex items-center justify-center cursor-pointer border border-[rgba(0,0,0,0.15)] shadow-xs"
        aria-label="Toggle full window size"
        title="Toggle full window"
      >
        {isHovered && (
          <svg className="w-2 h-2 text-[#004a11]" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="currentColor">
            <path d="M5 5h6v2H7v4H5V5zm8 12v-2h4v-4h2v6h-6z" />
          </svg>
        )}
      </button>
    </div>
  );
};
