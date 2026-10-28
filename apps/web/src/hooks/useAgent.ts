import { useAppStore } from '../store';

export function useAgent() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const composerText = useAppStore((s) => s.composerText);
  const setComposerText = useAppStore((s) => s.setComposerText);
  const approveStep = useAppStore((s) => s.approveStep);
  const denyStep = useAppStore((s) => s.denyStep);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return {
    mode,
    setMode,
    composerText,
    setComposerText,
    approveStep,
    denyStep,
    settings,
    updateSettings,
  };
}
