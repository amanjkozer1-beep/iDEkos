import React from 'react';
import { useAppStore, AppMode } from '../../store';

export const ModeSwitch: React.FC = () => {
  const { mode, setMode } = useAppStore();

  return (
    <div
      role="radiogroup"
      aria-label="Composer operational mode"
      className="inline-flex items-center p-1 rounded-full bg-[#050605] border border-white/5 shadow-inner select-none"
    >
      {/* Chat Option */}
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'chat'}
        onClick={() => setMode('chat')}
        className={`
          px-5 py-1.5 xl:py-2 rounded-full text-[14px] xl:text-[16px] transition-all duration-150 cursor-pointer outline-none font-medium
          ${
            mode === 'chat'
              ? 'bg-[#222A25] text-white shadow-sm font-semibold'
              : 'text-[#8F968F] hover:text-[#C5CBC5] bg-transparent'
          }
          focus-visible:ring-2 focus-visible:ring-[#FED100]/70
        `}
      >
        Chat
      </button>

      {/* Task Option */}
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'task'}
        onClick={() => setMode('task')}
        className={`
          px-5 py-1.5 xl:py-2 rounded-full text-[14px] xl:text-[16px] transition-all duration-150 cursor-pointer outline-none font-medium
          ${
            mode === 'task'
              ? 'bg-[#222A25] text-white shadow-sm font-semibold'
              : 'text-[#8F968F] hover:text-[#C5CBC5] bg-transparent'
          }
          focus-visible:ring-2 focus-visible:ring-[#FED100]/70
        `}
      >
        Task
      </button>
    </div>
  );
};
