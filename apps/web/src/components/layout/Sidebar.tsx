import React, { useRef } from 'react';
import {
  PanelLeft,
  Search,
  Filter,
  Sparkles,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store';
import { TrafficLights } from '../ui/TrafficLights';
import { FlagStripe } from '../ui/FlagStripe';
import { SunMark } from '../ui/SunMark';
import { MorePopover } from '../ui/MorePopover';
import { Navigation } from './Navigation';
import { Button } from '../ui/Button';

interface SidebarProps {
  width?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ width = 310, onResizeStart }) => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    morePopoverOpen,
    setMorePopoverOpen,
    searchOpen,
    setSearchOpen,
    resetToNewChat,
    tasks,
    activeTaskId,
    setActiveTaskId,
    filterQuery,
    setFilterQuery,
    projectsCollapsed,
    toggleProjectsCollapsed,
    accountMenuOpen,
    setAccountMenuOpen,
    setStudioOpen,
  } = useAppStore();

  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const filteredTasks = tasks.filter((t) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.prompt.toLowerCase().includes(q);
  });

  return (
    <aside
      aria-label="Sidebar navigation"
      style={{
        width: sidebarCollapsed ? '76px' : `${width}px`,
        minWidth: sidebarCollapsed ? '76px' : '280px',
        maxWidth: sidebarCollapsed ? '76px' : '440px',
      }}
      className="relative flex flex-col h-full bg-[#141A16] border-r border-white/5 transition-[width] duration-200 ease-out select-none shrink-0 z-20"
    >
      {/* Kurdish Flag Stripe */}
      <FlagStripe height={4} />

      {/* Header row: Traffic lights & search/sidebar toggle */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 min-h-[46px]">
        <TrafficLights />

        <div className="flex items-center gap-1.5 text-[#8F968F]">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search or press Cmd+K"
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Search (⌘K)"
          >
            <Search className="w-5 h-5 stroke-[1.75]" />
          </button>

          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle sidebar (⌘B)"
          >
            <PanelLeft className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>
      </div>

      {/* Brand row */}
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

      {/* Primary navigation */}
      <div className="mt-7 px-3 relative">
        <Navigation
          isCollapsed={sidebarCollapsed}
          moreBtnRef={moreButtonRef}
          onToggleMore={() => setMorePopoverOpen(!morePopoverOpen)}
          isMoreOpen={morePopoverOpen}
        />
        <MorePopover
          isOpen={morePopoverOpen}
          onClose={() => setMorePopoverOpen(false)}
          anchorRef={moreButtonRef}
        />
      </div>

      {/* Projects section */}
      <div className="px-5 flex-1 overflow-y-auto sidebar-scrollbar mt-6">
        {sidebarCollapsed ? (
          <div className="flex flex-col items-center pt-2">
            <button
              onClick={toggleProjectsCollapsed}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#8F968F] hover:text-white hover:bg-white/5 transition-colors"
              title="Projects"
            >
              <Filter className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <button
              onClick={toggleProjectsCollapsed}
              className="flex items-center gap-2 group cursor-pointer text-left py-1 outline-none"
            >
              <span className="text-[#8F968F] text-[18px] xl:text-[20px] font-normal group-hover:text-white transition-colors">
                Projects
              </span>
              {projectsCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#8F968F] group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#8F968F] group-hover:text-white transition-colors" />
              )}
            </button>

            {!projectsCollapsed && (
              <div className="flex flex-col mt-2">
                <div className="flex items-center justify-between py-1 px-1">
                  <button
                    onClick={() => setFilterQuery('')}
                    className="flex items-center gap-1.5 text-[#A5ABA5] hover:text-white text-[14px] font-normal"
                  >
                    <span>All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isFilterOpen || filterQuery
                        ? 'text-[#FED100] bg-white/10'
                        : 'text-[#8F968F] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isFilterOpen && (
                  <div className="flex items-center gap-2 px-2 py-1 mt-1 bg-black/40 border border-white/10 rounded-xl">
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Filter tasks..."
                      className="bg-transparent border-none text-xs text-white placeholder-[#7F867F] outline-none w-full"
                    />
                    {filterQuery && (
                      <button
                        onClick={() => setFilterQuery('')}
                        className="text-[#8F968F] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto sidebar-scrollbar pr-1">
                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-5 px-3 text-center rounded-xl bg-white/[0.02] border border-white/5">
                      <SunMark variant="small" size={20} />
                      <span className="text-[12px] text-[#8F968F] mt-1.5 font-normal">
                        No projects found
                      </span>
                    </div>
                  ) : (
                    filteredTasks.map((t) => {
                      const isActive = activeTaskId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTaskId(t.id)}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer outline-none group
                            ${
                              isActive
                                ? 'bg-[#060807] text-white border-l-2 border-[#FED100]'
                                : 'text-[#C9CECA] hover:bg-white/[0.06] hover:text-white'
                            }
                          `}
                        >
                          <div className="shrink-0 text-[#8F968F] group-hover:text-white">
                            {t.mode === 'task' ? (
                              <Sparkles className="w-3.5 h-3.5 text-[#FED100]/80" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5 text-[#8F968F]" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[13px] font-normal truncate">
                              {t.title}
                            </span>
                            <span className="text-[10px] text-[#8F968F]">
                              {t.createdAt}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account footer */}
      <div className="relative mt-auto pt-4 pb-6 px-4 select-none">
        <button
          onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          className={`flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white/[0.06] transition-all cursor-pointer text-left outline-none ${
            sidebarCollapsed ? 'justify-center p-1' : ''
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-[42px] h-[42px] rounded-full overflow-hidden bg-[#222A25] border border-white/15 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-linear-to-br from-[#1d2720] via-[#0d1410] to-[#251515] flex items-center justify-center relative">
                <div className="w-5 h-5 rounded-full bg-radial from-[#FED100]/40 via-[#ED2024]/30 to-transparent blur-xs" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#FED100] opacity-80" />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#278E43] border-2 border-[#141A16]" />
          </div>

          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0 justify-center">
              <span className="text-[#F5F4EF] text-[16px] font-normal truncate leading-tight">
                Ab N. Li
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[#8F968F] text-[13px] font-normal leading-tight">
                  Pro
                </span>
                <SunMark variant="small" size={16} className="shrink-0" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Resize handle */}
      {!sidebarCollapsed && onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#FED100]/40 transition-colors z-30"
          title="Drag to resize"
        />
      )}
    </aside>
  );
};
