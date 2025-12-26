import { useCallback } from 'react';
import { useConceptMapStore } from '../store/conceptMapStore';
import { useVimMode } from './useVimMode';
import { NodeShape, SHAPE_CONFIGS } from '../types/shapes';

/**
 * Hook for executing vim commands (like :shape, :w, etc.)
 */
export const useVimCommands = () => {
  const { updateNode } = useConceptMapStore();
  const vim = useVimMode();

  const executeCommand = useCallback(async (commandInput: string) => {
    const trimmed = commandInput.trim();

    if (!trimmed) {
      return { success: false, error: 'Empty command' };
    }

    // Parse command and arguments
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    console.log('[VIM COMMAND] Executing:', command, 'Args:', args);

    try {
      // :shape <shapename> - Change node shape
      if (command === 'shape') {
        if (!vim.state.focusedNodeId) {
          return { success: false, error: 'No node focused. Focus a node first.' };
        }

        if (args.length === 0) {
          // List available shapes
          const shapes = Object.entries(SHAPE_CONFIGS)
            .map(([key, config]) => `${key} (${config.description})`)
            .join(', ');
          return {
            success: true,
            message: `Available shapes: ${shapes}`
          };
        }

        const shapeName = args[0].toLowerCase();

        // Validate shape name
        if (!(shapeName in SHAPE_CONFIGS)) {
          const availableShapes = Object.keys(SHAPE_CONFIGS).join(', ');
          return {
            success: false,
            error: `Invalid shape: ${shapeName}. Available: ${availableShapes}`
          };
        }

        // Update the node
        await updateNode(vim.state.focusedNodeId, {
          shape: shapeName
        });

        return {
          success: true,
          message: `Shape changed to ${SHAPE_CONFIGS[shapeName as NodeShape].name}`
        };
      }

      // :w - Save (no-op since we have auto-save, but acknowledge it)
      if (command === 'w' || command === 'write') {
        return { success: true, message: 'Changes auto-saved' };
      }

      // :q - Close/deselect (can't actually quit the app)
      if (command === 'q' || command === 'quit') {
        vim.setFocus(null);
        vim.clearSelection();
        return { success: true, message: 'Deselected all nodes' };
      }

      // :wq - Save and deselect
      if (command === 'wq') {
        vim.setFocus(null);
        vim.clearSelection();
        return { success: true, message: 'Changes auto-saved, deselected all nodes' };
      }

      // Unknown command
      return {
        success: false,
        error: `Unknown command: ${command}. Try :shape <shapename>`
      };

    } catch (error) {
      console.error('[VIM COMMAND] Error:', error);
      return {
        success: false,
        error: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }, [vim, updateNode]);

  return { executeCommand };
};
