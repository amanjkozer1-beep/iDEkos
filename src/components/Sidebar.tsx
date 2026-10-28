import React, { useRef, useState } from 'react';
import {
  SquarePen,
  LayoutGrid,
  Image as ImageIcon,
  Clock,
  Sun,
  MoreHorizontal,
  Search,
  PanelLeft,
} from 'lucide-react';
import { useAppStore, NavRoute } from '../store/useAppStore';
import { TrafficLights } from './TrafficLights';
import { FlagStripe } from './FlagStripe';
import { SunMark } from './SunMark';
import { NavItem } from './NavItem';
import { MorePopover } from './MorePopover';
import { ProjectsSection } from './ProjectsSection';
import { AccountFooter } from './AccountFooter';

interface SidebarProps {
  width: number;
  onResizeStart?: (e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ width, onResizeStart }) => {
  const {
    currentRoute,
    setCurrentRoute,
    sidebarCollapsed,
    toggleSidebar,
    morePopoverOpen,
    setMorePopoverOpen,
    setSearchOpen,
    resetToNewChat,
  } = useAppStore();

  const moreButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <aside
      aria-label="Sidebar navigation"
      style={{
        width: sidebarCollapsed ? '76px' : `${width}px`,
        minWidth: sidebarCollapsed ? '76px' : '280px',
        maxWidth: sidebarCollapsed ? '76px' : '440px',
      }}
      className="relative flex flex-col h-full bg-[#141A16] border-r border-white/5 transition-[width] duration-220 ease-out select-none shrink-0 z-20"
    >
      {/* 2. FLAG STRIPE: thin 4px horizontal tri-color band (red / white / green) at top edge */}
      <FlagStripe height={4} />

      {/* 1. Header row: Traffic lights on left, Search & Toggle-Sidebar on right */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 min-h-[46px]">
        <TrafficLights />

        <div className="flex items-center gap-1.5 text-[#8F968F]">
          {/* Search Button (magnifier) */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search or press Cmd+K"
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
            title="Search (⌘K)"
          >
            <Search className="w-5 h-5 stroke-[1.75]" />
          </button>

          {/* Toggle Sidebar Button (rounded rect with left panel) */}
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
            title="Toggle sidebar (⌘B)"
          >
            <PanelLeft className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* 2. Brand row: K.O.S sun logo (32px) + wordmark "K.O.S" (34px, weight 500, white) */}
      <div
        className={`flex items-center mt-6 px-5 ${
          sidebarCollapsed ? 'justify-center px-0' : ''
        }`}
      >
        <button
          onClick={resetToNewChat}
          className="flex items-center cursor-pointer group outline-none"
          aria-label="K.O.S Home"
        >
          {sidebarCollapsed ? (
            <SunMark variant="icon" size={32} />
          ) : (
            <SunMark variant="wordmark" size={32} showTagline={false} />
          )}
        </button>
      </div>

      {/* 3. Primary nav list */}
      <nav
        className="flex flex-col gap-1.5 mt-7 px-3 relative"
        aria-label="Primary Navigation"
      >
        {/* New chat */}
        <NavItem
          id="new-chat"
          label="New chat"
          icon={<SquarePen className="w-6 h-6 stroke-[1.75]" />}
          isActive={currentRoute === 'new-chat'}
          isCollapsed={sidebarCollapsed}
          onClick={() => {
            resetToNewChat();
            setMorePopoverOpen(false);
          }}
        />

        {/* Library */}
        <NavItem
          id="library"
          label="Library"
          icon={<LayoutGrid className="w-6 h-6 stroke-[1.75]" />}
          isActive={currentRoute === 'library'}
          isCollapsed={sidebarCollapsed}
          onClick={() => {
            setCurrentRoute('library');
            setMorePopoverOpen(false);
          }}
        />

        {/* Images */}
        <NavItem
          id="images"
          label="Images"
          icon={<ImageIcon className="w-6 h-6 stroke-[1.75]" />}
          isActive={currentRoute === 'images'}
          isCollapsed={sidebarCollapsed}
          onClick={() => {
            setCurrentRoute('images');
            setMorePopoverOpen(false);
          }}
        />

        {/* Scheduled */}
        <NavItem
          id="scheduled"
          label="Scheduled"
          icon={<Clock className="w-6 h-6 stroke-[1.75]" />}
          isActive={currentRoute === 'scheduled'}
          isCollapsed={sidebarCollapsed}
          onClick={() => {
            setCurrentRoute('scheduled');
            setMorePopoverOpen(false);
          }}
        />

        {/* Daily brief */}
        <NavItem
          id="daily-brief"
          label="Daily brief"
          icon={<Sun className="w-6 h-6 stroke-[1.75]" />}
          isActive={currentRoute === 'daily-brief'}
          isCollapsed={sidebarCollapsed}
          onClick={() => {
            setCurrentRoute('daily-brief');
            setMorePopoverOpen(false);
          }}
        />

        {/* More (three dots) with anchored popover */}
        <div className="relative">
          <button
            ref={moreButtonRef}
            onClick={() => setMorePopoverOpen(!morePopoverOpen)}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={morePopoverOpen}
            className={`
              group relative flex items-center w-full transition-all duration-150 ease-out select-none cursor-pointer outline-none rounded-[999px]
              ${
                sidebarCollapsed
                  ? 'justify-center h-[52px] w-[52px] mx-auto p-0'
                  : 'h-[54px] xl:h-[60px] px-5 gap-4'
              }
              ${
                morePopoverOpen
                  ? 'bg-[rgba(255,255,255,0.09)] text-[#F5F4EF]'
                  : currentRoute === 'customize' || currentRoute === 'videos'
                  ? 'bg-[#060807] text-[#F5F4EF] nav-pill-active-border'
                  : 'text-[#E6E8E3] hover:bg-[rgba(255,255,255,0.07)] hover:text-[#FFFFFF]'
              }
              focus-visible:ring-2 focus-visible:ring-[#FED100]/70
            `}
          >
            <span className="shrink-0 flex items-center justify-center text-[#D2D6CE] group-hover:text-white">
              <MoreHorizontal className="w-6 h-6 stroke-[1.75]" />
            </span>
            {!sidebarCollapsed && (
              <span className="truncate font-normal text-[16px] sm:text-[18px] xl:text-[20px] text-[#E6E8E3]">
                More
              </span>
            )}
          </button>

          {/* 4. "More" popover anchored to right edge of More row */}
          <MorePopover
            isOpen={morePopoverOpen}
            onClose={() => setMorePopoverOpen(false)}
            anchorRef={moreButtonRef}
          />
        </div>
      </nav>

      {/* 5 & 6. Section "Projects >" & scrollable list */}
      <div className="px-5 flex-1 overflow-y-auto sidebar-scrollbar">
        <ProjectsSection isCollapsed={sidebarCollapsed} />
      </div>

      {/* 7. Footer: circular avatar 56px, name "Ab N. Li", plan "Pro" + small sun watermark */}
      <AccountFooter isCollapsed={sidebarCollapsed} />

      {/* Resize handle on right border */}
      {!sidebarCollapsed && onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#FED100]/40 transition-colors z-30"
          title="Drag to resize sidebar"
        />
      )}
    </aside>
  );
};
