import React from 'react';
import { Minimize2, Maximize2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SunMark } from './SunMark';

export const TopBar: React.FC = () => {
  const { isWindowExpanded, toggleWindowExpanded, setStudioOpen } =
    useAppStore();

  return (
    <div className="absolute top-5 right-6 z-30 flex items-center gap-3.5 select-none pointer-events-auto">
      {/* 1. Circular translucent button with compress / inward arrows icon */}
      <button
        onClick={toggleWindowExpanded}
        aria-label={
          isWindowExpanded
            ? 'Restore normal window size'
            : 'Expand window view'
        }
        className="
          w-10 h-10 xl:w-11 xl:h-11 rounded-full flex items-center justify-center
          bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] active:bg-[rgba(255,255,255,0.18)]
          border border-white/10 backdrop-blur-md text-[#D8DDD9] hover:text-white
          transition-all duration-150 cursor-pointer shadow-md
          focus-visible:ring-2 focus-visible:ring-[#FED100]/70
        "
        title={isWindowExpanded ? 'Restore window' : 'Compress / Expand window'}
      >
        {isWindowExpanded ? (
          <Minimize2 className="w-4 h-4 xl:w-5 xl:h-5 stroke-[1.75]" />
        ) : (
          <svg
            className="w-4 h-4 xl:w-5 xl:h-5 stroke-[1.75]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* 2. Pill button, translucent (rgba(255,255,255,.1)), with K.O.S sun icon + label "K.O.S Studio" */}
      <button
        onClick={() => setStudioOpen(true)}
        aria-label="Open K.O.S Studio coding environment"
        className="
          h-10 xl:h-11 px-4 xl:px-5 rounded-[999px] flex items-center gap-2.5
          bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.14)] active:bg-[rgba(255,255,255,0.18)]
          border border-white/10 backdrop-blur-md text-[#F5F4EF] hover:text-white
          transition-all duration-150 cursor-pointer shadow-md group
          focus-visible:ring-2 focus-visible:ring-[#FED100]/70
        "
      >
        <SunMark
          variant="icon"
          size={18}
          className="group-hover:scale-105 transition-transform drop-shadow-[0_0_6px_rgba(254,209,0,0.5)]"
        />
        <span className="text-[14px] xl:text-[16px] font-medium tracking-tight">
          K.O.S Studio
        </span>
      </button>
    </div>
  );
};
