import React from 'react';

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
      {/* Icon with 22-24px stroke */}
      <span
        className={`shrink-0 flex items-center justify-center transition-transform group-active:scale-95 ${
          isActive ? 'text-[#F5F4EF]' : 'text-[#D2D6CE] group-hover:text-white'
        }`}
      >
        {icon}
      </span>

      {/* Label */}
      {!isCollapsed && (
        <span
          className={`truncate font-normal tracking-[-0.01em] ${
            isActive ? 'text-[#F5F4EF] font-medium' : 'text-[#E6E8E3]'
          } text-[16px] sm:text-[18px] xl:text-[20px]`}
        >
          {label}
        </span>
      )}

      {/* Badge if present */}
      {!isCollapsed && badge && (
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
          {badge}
        </span>
      )}
    </button>
  );
};
