import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: string[];
  onExecute: (cmd: string) => Promise<any>;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, onExecute }) => {
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;
    const cmd = input.trim();
    setInput('');
    setIsRunning(true);
    await onExecute(cmd);
    setIsRunning(false);
  };

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden font-mono text-xs select-text">
      <div className="flex-1 text-[#8F968F] overflow-y-auto leading-relaxed select-text sidebar-scrollbar">
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={`${
              log.startsWith('$')
                ? 'text-[#FED100]'
                : log.includes('Error') || log.includes('error') || log.includes('blocked') || log.startsWith('✗')
                ? 'text-[#FF5F57]'
                : log.includes('Clean') || log.includes('passed') || log.includes('success') || log.startsWith('✓')
                ? 'text-[#28C840]'
                : 'text-[#A5ABA5]'
            }`}
          >
            {log}
          </div>
        ))}
        {isRunning && (
          <div className="flex items-center gap-2 text-[#FED100] mt-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Running child process...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-white/10">
        <span className="text-[#FED100] font-bold">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Run authorized command (e.g. npm test, ls, git status)..."
          className="flex-1 bg-transparent border-none text-white text-xs outline-none placeholder-[#555C56]"
        />
        <button
          type="submit"
          disabled={isRunning || !input.trim()}
          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
        >
          <Send className="w-3 h-3" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
