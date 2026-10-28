import React from 'react';
import { SquarePen, LayoutGrid, Image as ImageIcon, Clock, Sun, MoreHorizontal } from 'lucide-react';
import { useAppStore, NavRoute } from '../../store';

export interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick: () => void;
  badge?: string;
  hasSubmenu?: boolean;
  isOpenSubmenu?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  id,
  label,
  icon,
  isActive = false,
  isCollapsed = false,
  onClick,
  badge,
  hasSubmenu = false,
  isOpenSubmenu = false,
}) => {
  return (
    <button
      onClick={onClick}
      id={`nav-item-${id}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      aria-haspopup={hasSubmenu ? 'true' : undefined}
      aria-expanded={hasSubmenu ? isOpenSubmenu : undefined}
      className={`
        group relative flex items-center w-full transition-all duration-150 ease-out select-none cursor-pointer outline-none
        rounded-[999px]
        ${isCollapsed ? 'justify-center h-[52px] w-[52px] mx-auto p-0' : 'h-[54px] xl:h-[60px] px-5 gap-4'}
        ${
          isActive
            ? 'bg-[#060807] text-[#F5F4EF] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] nav-pill-active-border'
            : isOpenSubmenu
            ? 'bg-[rgba(255,255,255,0.09)] text-[#F5F4EF]'
            : 'text-[#E6E8E3] hover:bg-[rgba(255,255,255,0.07)] hover:text-[#FFFFFF]'
        }
        focus-visible:ring-2 focus-visible:ring-[#FED100]/70
      `}
      title={isCollapsed ? label : undefined}
    >
      <span
        className={`shrink-0 flex items-center justify-center transition-transform group-active:scale-95 ${
          isActive ? 'text-[#F5F4EF]' : 'text-[#D2D6CE] group-hover:text-white'
        }`}
      >
        {icon}
      </span>

      {!isCollapsed && (
        <span
          className={`truncate font-normal tracking-[-0.01em] ${
            isActive ? 'text-[#F5F4EF] font-medium' : 'text-[#E6E8E3]'
          } text-[16px] sm:text-[18px] xl:text-[20px]`}
        >
          {label}
        </span>
      )}

      {!isCollapsed && badge && (
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
          {badge}
        </span>
      )}
    </button>
  );
};

export const Navigation: React.FC<{
  isCollapsed: boolean;
  moreBtnRef: React.RefObject<HTMLButtonElement | null>;
  onToggleMore: () => void;
  isMoreOpen: boolean;
}> = ({ isCollapsed, moreBtnRef, onToggleMore, isMoreOpen }) => {
  const { currentRoute, setCurrentRoute, activeTaskId } = useAppStore();

  const isHomeActive = currentRoute === 'new-chat' && !activeTaskId;

  return (
    <nav className="flex flex-col gap-1.5 w-full">
      <NavItem
        id="new-chat"
        label="New chat"
        icon={<SquarePen className="w-[22px] h-[22px] xl:w-[24px] xl:h-[24px]" strokeWidth={1.8} />}
        isActive={isHomeActive}
        isCollapsed={isCollapsed}
        onClick={() => setCurrentRoute('new-chat')}
      />

      <NavItem
        id="library"
        label="Library"
        icon={<LayoutGrid className="w-[22px] h-[22px] xl:w-[24px] xl:h-[24px]" strokeWidth={1.8} />}
        isActive={currentRoute === 'library'}
        isCollapsed={isCollapsed}
        onClick={() => setCurrentRoute('library')}
      />

      <NavItem
        id="images"
        label="Images"
        icon={<ImageIcon className="w-[22px] h-[22px] xl:w-[24px] xl:h-[24px]" strokeWidth={1.8} />}
        isActive={currentRoute === 'images'}
        isCollapsed={isCollapsed}
        onClick={() => setCurrentRoute('images')}
      />

      <NavItem
        id="scheduled"
        label="Scheduled"
        icon={<Clock className="w-[22px] h-[22px] xl:w-[24px] xl:h-[24px]" strokeWidth={1.8} />}
        isActive={currentRoute === 'scheduled'}
        isCollapsed={isCollapsed}
        onClick={() => setCurrentRoute('scheduled')}
      />

      <NavItem
        id="daily-brief"
        label="Daily Brief"
        icon={<Sun className="w-[22px] h-[22px] xl:w-[24px] xl:h-[24px]" strokeWidth={1.8} />}
        isActive={currentRoute === 'daily-brief'}
        isCollapsed={isCollapsed}
        onClick={() => setCurrentRoute('daily-brief')}
      />

      {/* More Button */}
      <button
        ref={moreBtnRef}
        onClick={onToggleMore}
        aria-haspopup="true"
        aria-expanded={isMoreOpen}
        className={`
          group relative flex items-center w-full transition-all duration-150 ease-out select-none cursor-pointer outline-none
          rounded-[999px]
          ${isCollapsed ? 'justify-center h-[52px] w-[52px] mx-auto p-0' : 'h-[54px] xl:h-[60px] px-5 gap-4'}
          ${
            isMoreOpen
              ? 'bg-[rgba(255,255,255,0.09)] text-[#F5F4EF]'
              : 'text-[#E6E8E3] hover:bg-[rgba(255,255,255,0.07)] hover:text-[#FFFFFF]'
          }
          focus-visible:ring-2 focus-visible:ring-[#FED100]/70
        `}
      >
        <span className="shrink-0 flex items-center justify-center text-[#D2D6CE] group-hover:text-white">
          <MoreHorizontal className="w-[22px] h-[22px] xl:w-[24px] xl:h-[24px]" strokeWidth={1.8} />
        </span>
        {!isCollapsed && (
          <span className="truncate font-normal tracking-[-0.01em] text-[#E6E8E3] text-[16px] sm:text-[18px] xl:text-[20px]">
            More
          </span>
        )}
      </button>
    </nav>
  );
};
