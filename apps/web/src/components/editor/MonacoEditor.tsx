import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { SunMark } from '../ui/SunMark';

export function getLanguageFromPath(filePath: string): string {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.html')) return 'html';
  if (filePath.endsWith('.md')) return 'markdown';
  if (filePath.endsWith('.py')) return 'python';
  if (filePath.endsWith('.rs')) return 'rust';
  if (filePath.endsWith('.sh') || filePath.endsWith('.bash')) return 'shell';
  if (filePath.endsWith('.sql')) return 'sql';
  return 'plaintext';
}

interface MonacoEditorProps {
  filePath: string;
  content: string;
  onChange: (value: string) => void;
  onMount?: OnMount;
  readOnly?: boolean;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  filePath,
  content,
  onChange,
  onMount,
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onMount) onMount(editor, monaco);
  };

  return (
    <div className="h-full w-full relative bg-[#0B0E0C]">
      <Editor
        height="100%"
        path={filePath}
        language={getLanguageFromPath(filePath)}
        value={content}
        onChange={(val) => onChange(val || '')}
        onMount={handleMount}
        theme="vs-dark"
        loading={
          <div className="h-full w-full flex items-center justify-center bg-[#0B0E0C] gap-3 text-sm text-[#8F968F]">
            <SunMark variant="icon" size={24} className="animate-spin" />
            <span>Loading Monaco Editor...</span>
          </div>
        }
        options={{
          readOnly,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
          fontLigatures: true,
          minimap: { enabled: true, maxColumn: 80, renderCharacters: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          renderLineHighlight: 'all',
          overviewRulerBorder: false,
          padding: { top: 12, bottom: 12 },
          lineNumbersMinChars: 3,
          tabSize: 2,
        }}
      />
    </div>
  );
};
