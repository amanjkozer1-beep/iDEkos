import React, { useRef, useEffect } from 'react';
import {
  User,
  Settings,
  Sparkles,
  LogOut,
  Command,
  ShieldCheck,
  ChevronUp,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SunMark } from './SunMark';

interface AccountFooterProps {
  isCollapsed?: boolean;
}

export const AccountFooter: React.FC<AccountFooterProps> = ({
  isCollapsed = false,
}) => {
  const { accountMenuOpen, setAccountMenuOpen, setSearchOpen, setStudioOpen } =
    useAppStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen, setAccountMenuOpen]);

  return (
    <div className="relative mt-auto pt-4 pb-6 px-4 select-none">
      {/* Account Popover Menu */}
      {accountMenuOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="User account menu"
          className="absolute bottom-[calc(100%+8px)] left-4 z-50 w-72 glass-popover rounded-[24px] p-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* User Profile Header */}
          <div className="px-3 py-3 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#278E43] via-[#FED100] to-[#ED2024] p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#141A16] flex items-center justify-center text-white font-medium text-sm">
                AL
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-sm font-medium">Ab N. Li</span>
              <span className="text-xs text-[#8F968F] truncate">
                kos-pro@kozer.os
              </span>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setStudioOpen(true);
                setAccountMenuOpen(false);
              }}
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-[#F5F4EF] hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#FED100]" />
              <span>Open K.O.S Studio</span>
            </button>

            <button
              onClick={() => {
                setSearchOpen(true);
                setAccountMenuOpen(false);
              }}
              role="menuitem"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm text-[#F5F4EF] hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Command className="w-4 h-4 text-[#8F968F]" />
                <span>Command Palette</span>
              </div>
              <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#8F968F]">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setAccountMenuOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-[#F5F4EF] hover:bg-white/10 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#278E43]" />
              <span>Security & Sandbox Rules</span>
            </button>
          </div>

          <div className="pt-1 border-t border-white/10">
            <button
              onClick={() => setAccountMenuOpen(false)}
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm text-[#FF5F57] hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Profile Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setAccountMenuOpen(!accountMenuOpen)}
        aria-haspopup="true"
        aria-expanded={accountMenuOpen}
        aria-label="Account settings for Ab N. Li (Pro)"
        className={`
          flex items-center gap-4 w-full p-2 rounded-2xl hover:bg-white/[0.06] active:bg-white/10 transition-all duration-150 cursor-pointer text-left outline-none
          ${isCollapsed ? 'justify-center p-1' : ''}
          focus-visible:ring-2 focus-visible:ring-[#FED100]/70
        `}
      >
        {/* Circular Avatar 56px (scaled appropriately) */}
        <div className="relative shrink-0">
          <div className="w-[46px] h-[46px] xl:w-[54px] xl:h-[54px] rounded-full overflow-hidden bg-[#222A25] border border-white/15 flex items-center justify-center shadow-md">
            {/* Artistic avatar matching screenshot dark circular theme with glowing cosmic/warm core */}
            <div className="w-full h-full bg-linear-to-br from-[#1d2720] via-[#0d1410] to-[#251515] flex items-center justify-center relative">
              <div className="w-6 h-6 rounded-full bg-radial from-[#FED100]/40 via-[#ED2024]/30 to-transparent blur-xs" />
              <div className="w-4 h-4 rounded-full bg-[#FED100] opacity-80" />
            </div>
          </div>
          {/* Active status pip */}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#278E43] border-2 border-[#141A16]" />
        </div>

        {/* Name & Plan Details */}
        {!isCollapsed && (
          <div className="flex flex-col min-w-0 justify-center">
            <span className="text-[#F5F4EF] text-[18px] xl:text-[22px] font-normal tracking-tight truncate leading-tight">
              Ab N. Li
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[#8F968F] text-[15px] xl:text-[18px] font-normal leading-tight">
                Pro
              </span>
              {/* Small 24px Kurdish sun watermark at 12% opacity beside Pro label */}
              <SunMark variant="small" size={18} className="shrink-0" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
};
