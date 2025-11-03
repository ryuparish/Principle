import { useVim } from '../contexts/VimContext';

/**
 * Vim mode hook
 * Provides vim state and actions for manipulating it
 *
 * This is now a thin wrapper around the VimContext for backwards compatibility
 */
export const useVimMode = () => {
  return useVim();
};
