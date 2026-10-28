import { useAppStore } from '../store';

export function useWorkspace() {
  const workspaceTree = useAppStore((s) => s.workspaceTree);
  const selectedStudioFile = useAppStore((s) => s.selectedStudioFile);
  const selectedFileContent = useAppStore((s) => s.selectedFileContent);
  const terminalLogs = useAppStore((s) => s.terminalLogs);
  const diagnosticsStatus = useAppStore((s) => s.diagnosticsStatus);
  const unsavedFiles = useAppStore((s) => s.unsavedFiles);
  const gitStatusFiles = useAppStore((s) => s.gitStatusFiles);

  const fetchWorkspaceTree = useAppStore((s) => s.fetchWorkspaceTree);
  const selectStudioFile = useAppStore((s) => s.selectStudioFile);
  const updateFileContent = useAppStore((s) => s.updateFileContent);
  const saveStudioFile = useAppStore((s) => s.saveStudioFile);
  const createWorkspaceItem = useAppStore((s) => s.createWorkspaceItem);
  const deleteWorkspaceItem = useAppStore((s) => s.deleteWorkspaceItem);
  const searchWorkspace = useAppStore((s) => s.searchWorkspace);
  const fetchGitStatus = useAppStore((s) => s.fetchGitStatus);
  const runTerminalCommand = useAppStore((s) => s.runTerminalCommand);
  const runDiagnosticsCheck = useAppStore((s) => s.runDiagnosticsCheck);

  return {
    workspaceTree,
    selectedStudioFile,
    selectedFileContent,
    terminalLogs,
    diagnosticsStatus,
    unsavedFiles,
    gitStatusFiles,
    fetchWorkspaceTree,
    selectStudioFile,
    updateFileContent,
    saveStudioFile,
    createWorkspaceItem,
    deleteWorkspaceItem,
    searchWorkspace,
    fetchGitStatus,
    runTerminalCommand,
    runDiagnosticsCheck,
  };
}
