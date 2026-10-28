import React from 'react';
import { useAppStore } from '../store';
import { ModeSwitch } from '../components/ui/ModeSwitch';
import { Composer } from '../components/agent/Composer';
import { Watermark } from '../components/ui/Watermark';

export const NewChatPage: React.FC = () => {
  const { mode, setMode } = useAppStore();

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto select-none">
      {/* Kurdish Sun Watermark Background (Centered 21 rays, low opacity) */}
      <Watermark />

      <div className="w-full max-w-4xl flex flex-col items-center z-10">
        {/* Mode Switch Toggle ("Task" vs "Ask") */}
        <div className="mb-6 sm:mb-8">
          <ModeSwitch mode={mode} onModeChange={setMode} />
        </div>

        {/* Dynamic Greeting */}
        <h1 className="text-3xl sm:text-4xl xl:text-5xl font-light text-[#F5F4EF] mb-8 text-center tracking-tight">
          Good afternoon, Ab N. Li
        </h1>

        {/* Central Composer Input Card */}
        <Composer />
      </div>
    </div>
  );
};
