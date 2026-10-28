import React, { useEffect, useRef } from 'react';
import { Hexagon, Settings, Film, Video, Sparkles, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface MorePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export const MorePopover: React.FC<MorePopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { setCurrentRoute, currentRoute } = useAppStore();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-label="More options menu"
      className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in-95 duration-150 ease-out"
      style={{
        width: 'min(380px, calc(100vw - 320px))',
      }}
    >
      {/* Left-pointing pointer tail (16px) */}
      <div
        className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none"
        style={{
          borderTop: '11px solid transparent',
          borderBottom: '11px solid transparent',
          borderRight: '14px solid rgba(48, 55, 50, 0.82)',
          filter: 'drop-shadow(-3px 0 3px rgba(0,0,0,0.4))',
        }}
        aria-hidden="true"
      />

      {/* Main glassmorphic card */}
      <div className="glass-popover rounded-[28px] p-3 flex flex-col gap-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-[28px]">
        {/* Customize Item */}
        <button
          onClick={() => {
            setCurrentRoute('customize');
            onClose();
          }}
          role="menuitem"
          className={`
            group flex items-center h-[60px] xl:h-[64px] px-4 gap-4 rounded-[20px] transition-all duration-150 cursor-pointer text-left w-full outline-none
            ${
              currentRoute === 'customize'
                ? 'bg-white/15 text-white'
                : 'text-[#F5F4EF] hover:bg-white/10 active:bg-white/15'
            }
            focus-visible:ring-2 focus-visible:ring-[#FED100]/70
          `}
        >
          {/* Hexagon with gear icon */}
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0 text-[#E6E8E3] group-hover:text-white transition-colors">
            <Hexagon className="w-6 h-6 stroke-[1.75]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-currentColor" />
            </div>
          </div>

          <span className="text-[17px] xl:text-[19px] font-normal tracking-tight text-[#F5F4EF]">
            Customize
          </span>

          {currentRoute === 'customize' && (
            <Check className="ml-auto w-5 h-5 text-[#FED100]" />
          )}
        </button>

        {/* Videos Item */}
        <button
          onClick={() => {
            setCurrentRoute('videos');
            onClose();
          }}
          role="menuitem"
          className={`
            group flex items-center h-[60px] xl:h-[64px] px-4 gap-4 rounded-[20px] transition-all duration-150 cursor-pointer text-left w-full outline-none
            ${
              currentRoute === 'videos'
                ? 'bg-white/15 text-white'
                : 'text-[#F5F4EF] hover:bg-white/10 active:bg-white/15'
            }
            focus-visible:ring-2 focus-visible:ring-[#FED100]/70
          `}
        >
          {/* Rounded film / video icon */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[#E6E8E3] group-hover:text-white transition-colors">
            <svg
              className="w-6 h-6 stroke-[1.75]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect x="2" y="4" width="20" height="16" rx="4" />
              <path d="M7 8h10M7 12h10M7 16h6" strokeLinecap="round" />
            </svg>
          </div>

          <span className="text-[17px] xl:text-[19px] font-normal tracking-tight text-[#F5F4EF]">
            Videos
          </span>

          {currentRoute === 'videos' && (
            <Check className="ml-auto w-5 h-5 text-[#FED100]" />
          )}
        </button>
      </div>
    </div>
  );
};
