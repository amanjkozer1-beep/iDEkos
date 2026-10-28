import React, { useRef, useEffect } from 'react';
import {
  Plus,
  Folder,
  ChevronDown,
  Monitor,
  Mic,
  MicOff,
  ArrowUp,
  FileCode,
  Link,
  Upload,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ComposerProps {
  onOpenFolderPicker: () => void;
  onOpenAttachMenu: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onOpenFolderPicker,
  onOpenAttachMenu,
}) => {
  const {
    mode,
    composerText,
    setComposerText,
    createNewTask,
    selectedFolder,
    isMicActive,
    toggleMic,
    isScreenSharing,
    toggleScreenShare,
    attachMenuOpen,
    setAttachMenuOpen,
  } = useAppStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-resize textarea height to accommodate multi-line task descriptions
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(
        Math.max(scrollHeight, 44),
        220
      )}px`;
    }
  }, [composerText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!composerText.trim()) return;

    createNewTask(composerText.trim(), mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholderText =
    mode === 'task'
      ? 'Describe a task'
      : 'Ask anything or describe an idea';

  return (
    <div
      className="w-full relative rounded-[36px] xl:rounded-[40px] bg-[#000000] border border-white/[0.08] p-6 sm:p-7 xl:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all duration-200 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-[#FED100]/50"
    >
      {/* Top section: auto-grow textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholderText}
          aria-label={placeholderText}
          className="
            w-full bg-transparent border-none resize-none outline-none
            text-[#F5F4EF] placeholder-[#7F867F] font-normal
            text-[20px] sm:text-[24px] xl:text-[28px] tracking-[-0.01em] leading-normal
          "
        />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between mt-6 xl:mt-8 pt-2 select-none">
        {/* Left actions group: +, Files & folders, Share screen */}
        <div className="flex items-center gap-3 sm:gap-5 xl:gap-7 text-[#A5ABA5]">
          {/* + button for attachment menu */}
          <div className="relative">
            <button
              ref={attachBtnRef}
              type="button"
              onClick={() => setAttachMenuOpen(!attachMenuOpen)}
              aria-label="Add attachment, file or context"
              aria-haspopup="menu"
              aria-expanded={attachMenuOpen}
              className="
                w-9 h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center
                hover:text-white hover:bg-white/10 active:bg-white/15
                transition-all duration-150 cursor-pointer
                focus-visible:ring-2 focus-visible:ring-[#FED100]/70
              "
              title="Add attachment"
            >
              <Plus className="w-5 h-5 xl:w-6 xl:h-6 stroke-[2]" />
            </button>

            {/* Attach Context Menu */}
            {attachMenuOpen && (
              <div
                role="menu"
                className="absolute left-0 bottom-[calc(100%+10px)] z-50 w-56 glass-popover rounded-2xl p-1.5 shadow-2xl animate-in fade-in duration-100"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAttachMenuOpen(false);
                    onOpenFolderPicker();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#F5F4EF] hover:bg-white/10 transition-colors"
                >
                  <Folder className="w-4 h-4 text-[#FED100]" />
                  <span>Attach Workspace Folder</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAttachMenuOpen(false);
                    setComposerText(
                      composerText + (composerText ? ' ' : '') + '@src/components'
                    );
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#F5F4EF] hover:bg-white/10 transition-colors"
                >
                  <FileCode className="w-4 h-4 text-[#278E43]" />
                  <span>Reference Source Code</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAttachMenuOpen(false);
                    setComposerText(
                      composerText +
                        (composerText ? ' ' : '') +
                        '--test-driven --agent-verify'
                    );
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#F5F4EF] hover:bg-white/10 transition-colors"
                >
                  <Upload className="w-4 h-4 text-[#ED2024]" />
                  <span>Attach Verification Harness</span>
                </button>
              </div>
            )}
          </div>

          {/* Files & folders with folder icon + chevron-down */}
          <button
            type="button"
            onClick={onOpenFolderPicker}
            aria-label={`Current folder: ${selectedFolder}. Click to change.`}
            className="
              flex items-center gap-2 py-1 px-2 -ml-2 rounded-xl
              hover:text-white hover:bg-white/10 active:bg-white/15
              transition-all duration-150 cursor-pointer
              focus-visible:ring-2 focus-visible:ring-[#FED100]/70
            "
          >
            <Folder className="w-5 h-5 xl:w-[22px] xl:h-[22px] stroke-[1.75]" />
            <span className="text-[15px] sm:text-[17px] xl:text-[19px] font-normal tracking-tight">
              Files & folders
            </span>
            <ChevronDown className="w-4 h-4 xl:w-5 xl:h-5 opacity-70 stroke-[1.75]" />
          </button>

          {/* Share screen button */}
          <button
            type="button"
            onClick={toggleScreenShare}
            aria-label={
              isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'
            }
            className={`
              flex items-center gap-2 py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer
              focus-visible:ring-2 focus-visible:ring-[#FED100]/70
              ${
                isScreenSharing
                  ? 'text-[#28C840] bg-[#278E43]/15 border border-[#278E43]/30'
                  : 'hover:text-white hover:bg-white/10 active:bg-white/15'
              }
            `}
          >
            {/* Screen share monitor with arrow */}
            <svg
              className="w-5 h-5 xl:w-[22px] xl:h-[22px] stroke-[1.75]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 21h8M12 17v4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 8l4 0m0 0l0 4m0-4l-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[15px] sm:text-[17px] xl:text-[19px] font-normal tracking-tight">
              {isScreenSharing ? 'Screen active' : 'Share screen'}
            </span>
            {isScreenSharing && (
              <span className="w-2 h-2 rounded-full bg-[#28C840] animate-pulse" />
            )}
          </button>
        </div>

        {/* Right actions: Mic + Submit Button */}
        <div className="flex items-center gap-2">
          {/* Microphone icon button (animated active state) */}
          <button
            type="button"
            onClick={toggleMic}
            aria-label={isMicActive ? 'Stop listening' : 'Start voice input'}
            className={`
              w-9 h-9 xl:w-10 xl:h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
              focus-visible:ring-2 focus-visible:ring-[#FED100]/70
              ${
                isMicActive
                  ? 'bg-[#ED2024] text-white shadow-[0_0_12px_rgba(237,32,36,0.6)] animate-pulse'
                  : 'text-[#A5ABA5] hover:text-white hover:bg-white/10 active:bg-white/15'
              }
            `}
            title={isMicActive ? 'Microphone listening...' : 'Dictate task'}
          >
            {isMicActive ? (
              <Mic className="w-5 h-5 xl:w-6 xl:h-6 stroke-[1.75]" />
            ) : (
              <Mic className="w-5 h-5 xl:w-6 xl:h-6 stroke-[1.75]" />
            )}
          </button>

          {/* Enter/Send arrow button if text is entered */}
          {composerText.trim() && (
            <button
              type="button"
              onClick={() => handleSubmit()}
              aria-label="Submit task"
              className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-[#FED100] text-black hover:bg-[#FFE24A] flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
