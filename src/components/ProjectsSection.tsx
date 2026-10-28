import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { useAppStore, TaskItem } from '../store/useAppStore';
import { SunMark } from './SunMark';

interface ProjectsSectionProps {
  isCollapsed?: boolean;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  isCollapsed = false,
}) => {
  const {
    tasks,
    activeTaskId,
    setActiveTaskId,
    filterQuery,
    setFilterQuery,
    projectsCollapsed,
    toggleProjectsCollapsed,
  } = useAppStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center mt-6 pt-4 border-t border-white/5">
        <button
          onClick={toggleProjectsCollapsed}
          aria-label="Toggle projects section"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#8F968F] hover:text-white hover:bg-white/5 transition-colors"
        >
          <Filter className="w-5 h-5 stroke-[1.75]" />
        </button>
      </div>
    );
  }

  const filteredTasks = tasks.filter((t) => {
    if (!filterQuery) return true;
    const query = filterQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.prompt.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col mt-8 xl:mt-10 select-none">
      {/* Header: "Projects >" */}
      <button
        onClick={toggleProjectsCollapsed}
        aria-expanded={!projectsCollapsed}
        className="flex items-center gap-2 group cursor-pointer text-left py-1 outline-none focus-visible:ring-1 focus-visible:ring-[#FED100]"
      >
        <span className="text-[#8F968F] text-[18px] xl:text-[22px] font-normal group-hover:text-white transition-colors">
          Projects
        </span>
        {projectsCollapsed ? (
          <ChevronRight className="w-5 h-5 text-[#8F968F] group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#8F968F] group-hover:text-white transition-colors" />
        )}
      </button>

      {/* If section is expanded */}
      {!projectsCollapsed && (
        <div className="flex flex-col mt-3">
          {/* Subheader row: "All >" on left, filter funnel on right */}
          <div className="flex items-center justify-between py-1 px-1">
            <button
              onClick={() => setFilterQuery('')}
              className="flex items-center gap-1.5 text-[#A5ABA5] hover:text-white text-[15px] xl:text-[17px] font-normal cursor-pointer transition-colors"
            >
              <span>All</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Filter projects"
              aria-expanded={isFilterOpen}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFilterOpen || filterQuery
                  ? 'text-[#FED100] bg-white/10'
                  : 'text-[#8F968F] hover:text-white hover:bg-white/5'
              }`}
            >
              <Filter className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>

          {/* Search/filter inline input */}
          {isFilterOpen && (
            <div className="flex items-center gap-2 px-2 py-1.5 mt-1 bg-black/40 border border-white/10 rounded-xl">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter tasks..."
                autoFocus
                className="bg-transparent border-none text-xs text-white placeholder-[#7F867F] outline-none w-full"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  aria-label="Clear filter"
                  className="text-[#8F968F] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Scrollable list of chats/projects */}
          <div className="mt-2 flex flex-col gap-1 max-h-[220px] xl:max-h-[260px] overflow-y-auto sidebar-scrollbar pr-1">
            {filteredTasks.length === 0 ? (
              /* Empty state showing small 24px sun mark */
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                <SunMark variant="small" size={24} />
                <span className="text-[13px] text-[#8F968F] mt-2 font-normal">
                  No projects found
                </span>
              </div>
            ) : (
              filteredTasks.map((item) => {
                const isActive = activeTaskId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTaskId(item.id)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer outline-none group
                      ${
                        isActive
                          ? 'bg-[#060807] text-white border-l-2 border-[#FED100]'
                          : 'text-[#C9CECA] hover:bg-white/[0.06] hover:text-white'
                      }
                      focus-visible:ring-1 focus-visible:ring-[#FED100]
                    `}
                  >
                    <div className="shrink-0 text-[#8F968F] group-hover:text-white">
                      {item.mode === 'task' ? (
                        <Sparkles className="w-4 h-4 text-[#FED100]/80" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-[#8F968F]" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[14px] xl:text-[15px] font-normal truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-[#8F968F]">
                        {item.createdAt}
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
  );
};
