import { useEffect, useCallback } from 'react';
import { VimKeyEvent, GraphObject } from '../types/vim.types';
import { useVimMode } from './useVimMode';
import { useGraphNavigation } from './useGraphNavigation';
import { useVimOperations } from './useVimOperations';

/**
 * Keyboard handler hook
 * Captures keyboard events and processes them based on vim mode
 */
export const useKeyboardHandler = () => {
  const vim = useVimMode();
  const navigation = useGraphNavigation();
  const operations = useVimOperations();

  // Check if event target is an editable element
  const isEditableElement = useCallback((target: EventTarget | null): boolean => {
    if (!target) return false;
    const element = target as HTMLElement;
    return (
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.isContentEditable ||
      element.closest('.tiptap') !== null || // TipTap editor
      element.closest('.node-title-input') !== null || // Node title input
      element.closest('.modal-content') !== null // Modal open
    );
  }, []);

  // Create vim key event from native event
  const createVimKeyEvent = useCallback((e: KeyboardEvent): VimKeyEvent => {
    return {
      key: e.key,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      meta: e.metaKey,
      alt: e.altKey
    };
  }, []);

  // Main keyboard event handler
  const handleKeyDown = useCallback(async (e: KeyboardEvent) => {
    // Don't process if vim mode is disabled
    if (!vim.state.enabled) {
      console.log('[VIM] Vim mode disabled');
      return;
    }

    const vimKey = createVimKeyEvent(e);
    const isEditable = isEditableElement(e.target);

    console.log('[VIM] Key pressed:', vimKey.key, 'Mode:', vim.state.mode, 'Enabled:', vim.state.enabled, 'Focused:', vim.state.focusedNodeId);

    // Global shortcuts that work in all modes
    // Ctrl+; to toggle vim mode
    if (vimKey.ctrl && vimKey.key === ';') {
      e.preventDefault();
      vim.toggleEnabled();
      return;
    }

    // INSERT MODE: Only capture Escape to exit
    if (vim.state.mode === 'insert') {
      if (vimKey.key === 'Escape' || (vimKey.ctrl && vimKey.key === '[')) {
        e.preventDefault();
        vim.enterNormalMode();
      }
      // Let all other keys pass through to the editor
      return;
    }

    // COMMAND MODE: Handle command input
    if (vim.state.mode === 'command') {
      if (vimKey.key === 'Escape' || (vimKey.ctrl && vimKey.key === '[')) {
        e.preventDefault();
        if (vim.state.search.active) {
          vim.exitSearch();
        } else {
          vim.enterNormalMode();
        }
        return;
      }

      if (vimKey.key === 'Enter') {
        e.preventDefault();
        // Command execution will be handled in Phase 7
        // For now, just exit command mode
        vim.enterNormalMode();
        return;
      }

      if (vimKey.key === 'Backspace') {
        e.preventDefault();
        const current = vim.state.commandInput;
        vim.setCommandInput(current.slice(0, -1));
        return;
      }

      // Add character to command input (only printable characters)
      if (vimKey.key.length === 1 && !vimKey.ctrl && !vimKey.meta) {
        e.preventDefault();
        vim.setCommandInput(vim.state.commandInput + vimKey.key);
      }

      return;
    }

    // Don't intercept keys when typing in editable elements (except in vim modes)
    if (isEditable && vim.state.mode === 'normal') {
      return;
    }

    // NORMAL MODE & VISUAL MODE & EDGE MODE & MOVE MODE
    // Prevent default for most vim keys
    const shouldPreventDefault =
      vim.state.mode !== 'normal' || // Always prevent in non-normal modes
      'hjklwebfnpxyducvioasgtm:/?.'.includes(vimKey.key.toLowerCase()) ||
      vimKey.key === 'Tab' ||
      vimKey.key === 'Escape' ||
      vimKey.key === 'Enter' ||
      (vimKey.ctrl && ['o', 'i', 'r', 'd', 'u'].includes(vimKey.key));

    if (shouldPreventDefault) {
      e.preventDefault();
    }

    // Mode switching (will be used in later phases)
    if (vim.state.mode === 'normal') {
      // i - enter insert mode
      if (vimKey.key === 'i' && !vimKey.ctrl && !vimKey.shift) {
        vim.enterInsertMode();
        return;
      }

      // I - open node editor modal
      if (vimKey.key === 'I' && vimKey.shift && !vimKey.ctrl && !vimKey.meta) {
        if (vim.state.focusedNodeId) {
          vim.openEditor(vim.state.focusedNodeId);
        }
        return;
      }

      // v - enter visual mode (Phase 5)
      if (vimKey.key === 'v' && !vimKey.ctrl) {
        console.log('[VIM] Entering visual mode, focused node:', vim.state.focusedNodeId);
        vim.enterVisualMode();
        return;
      }

      // : - enter command mode
      if (vimKey.key === ':' && vim.state.shift) {
        vim.enterCommandMode();
        return;
      }

      // / - enter search mode
      if (vimKey.key === '/') {
        vim.startSearch('');
        return;
      }

      // m - enter move mode
      if (vimKey.key === 'm' && !vimKey.ctrl && !vimKey.meta && !vim.state.operatorPending) {
        if (vim.state.focusedNodeId) {
          vim.enterMoveMode();
        }
        return;
      }

      // e - enter edge mode
      if (vimKey.key === 'e' && !vimKey.shift && !vimKey.ctrl && !vimKey.meta && !vim.state.operatorPending) {
        if (vim.state.focusedNodeId) {
          vim.startEdgeMode(vim.state.focusedNodeId);
        }
        return;
      }

      // E - enter edge edit mode
      if (vimKey.key === 'E' && vimKey.shift && !vimKey.ctrl && !vimKey.meta && !vim.state.operatorPending) {
        if (vim.state.focusedNodeId) {
          // Get edges connected to this node (both incoming and outgoing)
          const focusedNodeId = vim.state.focusedNodeId;
          const connectedEdgeIds = operations.getConnectedEdgeIds(focusedNodeId);

          if (connectedEdgeIds.length > 0) {
            vim.startEdgeEditMode(focusedNodeId, connectedEdgeIds);
          } else {
            console.log('[EDGE EDIT] No edges connected to this node');
          }
        }
        return;
      }

      // Escape - clear any pending state
      if (vimKey.key === 'Escape') {
        vim.clearCommandBuffer();
        vim.clearSelection();
        return;
      }
    }

    // VISUAL MODE
    if (vim.state.mode === 'visual') {
      // v - toggle back to normal mode
      if (vimKey.key === 'v' && !vimKey.ctrl) {
        vim.enterNormalMode();
        vim.clearSelection();
        return;
      }

      // Escape - exit visual mode
      if (vimKey.key === 'Escape' || (vimKey.ctrl && vimKey.key === '[')) {
        vim.enterNormalMode();
        vim.clearSelection();
        return;
      }
    }

    // EDGE MODE
    if (vim.state.mode === 'edge') {
      // Escape or e - exit edge mode
      if (vimKey.key === 'Escape' || vimKey.key === 'e' || (vimKey.ctrl && vimKey.key === '[')) {
        vim.exitEdgeMode();
        return;
      }

      // Enter - create edge
      if (vimKey.key === 'Enter') {
        const sourceId = vim.state.edgeMode.sourceNodeId;
        const targetId = vim.state.focusedNodeId;

        if (sourceId && targetId && sourceId !== targetId) {
          // Create edge using operations hook
          operations.createEdgeOperation(sourceId, targetId);
        }
        vim.exitEdgeMode();
        return;
      }

      // Navigation in edge mode (to select target)
      // As you navigate, the focused node becomes the potential target
      if (vimKey.key === 'h') {
        navigation.navigateDirection('left');
        return;
      }
      if (vimKey.key === 'j') {
        navigation.navigateDirection('down');
        return;
      }
      if (vimKey.key === 'k') {
        navigation.navigateDirection('up');
        return;
      }
      if (vimKey.key === 'l') {
        navigation.navigateDirection('right');
        return;
      }
    }

    // MOVE MODE
    if (vim.state.mode === 'move') {
      const focusedNodeId = vim.state.focusedNodeId;
      if (!focusedNodeId) {
        vim.enterNormalMode();
        return;
      }

      // Escape, Enter, or m - exit move mode
      if (vimKey.key === 'Escape' || vimKey.key === 'Enter' || vimKey.key === 'm' || (vimKey.ctrl && vimKey.key === '[')) {
        vim.enterNormalMode();
        return;
      }

      // hjkl - move the focused node
      const MOVE_DISTANCE = 50; // pixels to move per keypress

      if (vimKey.key === 'h') {
        // Move left
        operations.moveFocusedNode(-MOVE_DISTANCE, 0);
        return;
      }
      if (vimKey.key === 'j') {
        // Move down
        operations.moveFocusedNode(0, MOVE_DISTANCE);
        return;
      }
      if (vimKey.key === 'k') {
        // Move up
        operations.moveFocusedNode(0, -MOVE_DISTANCE);
        return;
      }
      if (vimKey.key === 'l') {
        // Move right
        operations.moveFocusedNode(MOVE_DISTANCE, 0);
        return;
      }
    }

    // EDGE EDIT MODE
    if (vim.state.mode === 'edgeEdit') {
      // Escape or E - exit edge edit mode
      if (vimKey.key === 'Escape' || vimKey.key === 'E' || (vimKey.ctrl && vimKey.key === '[')) {
        vim.exitEdgeEditMode();
        return;
      }

      // j - select next edge
      if (vimKey.key === 'j') {
        vim.selectNextEdge();
        return;
      }

      // k - select previous edge
      if (vimKey.key === 'k') {
        vim.selectPrevEdge();
        return;
      }

      // x or dd - delete selected edge
      if (vimKey.key === 'x' && !vimKey.ctrl && !vimKey.meta) {
        await operations.deleteSelectedEdge();
        return;
      }

      // d - enter operator pending for delete
      if (vimKey.key === 'd' && vim.state.commandBuffer === '') {
        vim.appendCommandBuffer('d');
        setTimeout(() => {
          if (vim.state.commandBuffer === 'd') {
            vim.clearCommandBuffer();
          }
        }, 1000);
        return;
      }

      // dd - delete selected edge
      if (vim.state.commandBuffer === 'd' && vimKey.key === 'd') {
        await operations.deleteSelectedEdge();
        vim.clearCommandBuffer();
        return;
      }

      // h - jump to source node of selected edge
      if (vimKey.key === 'h') {
        const sourceNodeId = operations.getSelectedEdgeSourceId();
        if (sourceNodeId) {
          vim.setFocus(sourceNodeId);
          vim.exitEdgeEditMode();
        }
        return;
      }

      // l or Enter - jump to target node of selected edge
      if (vimKey.key === 'l' || vimKey.key === 'Enter') {
        const targetNodeId = operations.getSelectedEdgeTargetId();
        if (targetNodeId) {
          vim.setFocus(targetNodeId);
          vim.exitEdgeEditMode();
        }
        return;
      }
    }

    // OPERATIONS (Normal mode)
    if (vim.state.mode === 'normal') {
      // Operator-pending mode: handle graph objects after operator
      if (vim.state.operatorPending) {
        const operator = vim.state.operatorPending;

        // Check for graph object keys
        if (vimKey.key === 'n') {
          // Operator + node
          if (operator === 'd') {
            await operations.deleteOperation('n');
          } else if (operator === 'y') {
            operations.yankOperation('n');
          } else if (operator === 'c') {
            await operations.changeOperation('n');
          }
          vim.clearCommandBuffer();
          return;
        }

        if (vimKey.key === 'c') {
          // Operator + connected
          if (operator === 'd') {
            await operations.deleteOperation('c');
          } else if (operator === 'y') {
            operations.yankOperation('c');
          }
          vim.clearCommandBuffer();
          return;
        }

        if (vimKey.key === 't') {
          // Operator + tree
          if (operator === 'd') {
            await operations.deleteOperation('t');
          } else if (operator === 'y') {
            operations.yankOperation('t');
          }
          vim.clearCommandBuffer();
          return;
        }

        if (vimKey.key === 's') {
          // Operator + selected
          if (operator === 'd') {
            await operations.deleteOperation('s');
          } else if (operator === 'y') {
            operations.yankOperation('s');
          }
          vim.clearCommandBuffer();
          return;
        }

        if (vimKey.key === 'a') {
          // Operator + all
          if (operator === 'd') {
            await operations.deleteOperation('a');
          } else if (operator === 'y') {
            operations.yankOperation('a');
          }
          vim.clearCommandBuffer();
          return;
        }

        // Escape cancels operator-pending
        if (vimKey.key === 'Escape') {
          vim.clearCommandBuffer();
          return;
        }
      }

      // Operator keys (enter operator-pending mode)
      if (vimKey.key === 'd' && !vimKey.ctrl && !vimKey.meta && !vim.state.operatorPending) {
        vim.setOperatorPending('d');
        vim.appendCommandBuffer('d');
        // Auto-clear after timeout
        setTimeout(() => {
          if (vim.state.commandBuffer === 'd') {
            vim.clearCommandBuffer();
          }
        }, 2000);
        return;
      }

      if (vimKey.key === 'y' && !vimKey.ctrl && !vimKey.meta && !vim.state.operatorPending) {
        vim.setOperatorPending('y');
        vim.appendCommandBuffer('y');
        // Auto-clear after timeout
        setTimeout(() => {
          if (vim.state.commandBuffer === 'y') {
            vim.clearCommandBuffer();
          }
        }, 2000);
        return;
      }

      if (vimKey.key === 'c' && !vimKey.ctrl && !vimKey.meta && !vim.state.operatorPending) {
        vim.setOperatorPending('c');
        vim.appendCommandBuffer('c');
        // Auto-clear after timeout
        setTimeout(() => {
          if (vim.state.commandBuffer === 'c') {
            vim.clearCommandBuffer();
          }
        }, 2000);
        return;
      }

      // Quick operations (no motion required)
      // x - delete focused node
      if (vimKey.key === 'x' && !vimKey.ctrl && !vimKey.meta) {
        await operations.deleteFocusedNode();
        return;
      }

      // p - paste
      if (vimKey.key === 'p' && !vimKey.ctrl && !vimKey.meta) {
        await operations.pasteOperation(false);
        return;
      }

      // P - paste as connected
      if (vimKey.key === 'P' && vimKey.shift && !vimKey.ctrl && !vimKey.meta) {
        await operations.pasteOperation(true);
        return;
      }

      // u - undo (will be implemented when history is added)
      if (vimKey.key === 'u' && !vimKey.ctrl && !vimKey.meta) {
        // TODO: Implement undo
        console.log('Undo not yet implemented');
        return;
      }

      // Ctrl+r - redo
      if (vimKey.ctrl && vimKey.key === 'r') {
        // TODO: Implement redo
        console.log('Redo not yet implemented');
        return;
      }

      // . - repeat last operation
      if (vimKey.key === '.' && !vimKey.ctrl && !vimKey.meta) {
        if (vim.state.lastOperation) {
          // TODO: Implement repeat
          console.log('Repeat not yet implemented');
        }
        return;
      }
    }

    // OPERATIONS (Visual mode - operate on selection)
    if (vim.state.mode === 'visual') {
      // d - delete selection
      if (vimKey.key === 'd' && !vimKey.ctrl && !vimKey.meta) {
        console.log('[VIM] Deleting selection, selected nodes:', Array.from(vim.state.selectedNodeIds));
        await operations.deleteSelection();
        vim.enterNormalMode();
        return;
      }

      // y - yank selection
      if (vimKey.key === 'y' && !vimKey.ctrl && !vimKey.meta) {
        operations.yankSelection();
        vim.enterNormalMode();
        return;
      }

      // x - delete selection (alternative)
      if (vimKey.key === 'x' && !vimKey.ctrl && !vimKey.meta) {
        await operations.deleteSelection();
        vim.enterNormalMode();
        return;
      }
    }

    // NAVIGATION (Normal and Visual modes)
    if (vim.state.mode === 'normal' || vim.state.mode === 'visual') {
      // Spatial navigation (h/j/k/l)
      if (vimKey.key === 'h' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateDirection('left');
        return;
      }
      if (vimKey.key === 'j' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateDirection('down');
        return;
      }
      if (vimKey.key === 'k' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateDirection('up');
        return;
      }
      if (vimKey.key === 'l' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateDirection('right');
        return;
      }

      // Tab navigation (connected nodes)
      if (vimKey.key === 'Tab') {
        e.preventDefault();
        navigation.navigateConnected(vimKey.shift);
        return;
      }

      // w - next child
      if (vimKey.key === 'w' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateToNextChild();
        return;
      }

      // b - previous parent
      if (vimKey.key === 'b' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateToPrevParent();
        return;
      }

      // { - parent node
      if (vimKey.key === '{' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateToParent();
        return;
      }

      // } - child node
      if (vimKey.key === '}' && !vimKey.ctrl && !vimKey.meta) {
        navigation.navigateToChild();
        return;
      }

      // gg - jump to first (handled via command buffer)
      if (vim.state.commandBuffer === 'g' && vimKey.key === 'g') {
        navigation.jumpToFirst();
        vim.clearCommandBuffer();
        return;
      }

      // G - jump to last
      if (vimKey.key === 'G' && vimKey.shift) {
        navigation.jumpToLast();
        return;
      }

      // zz - center on focused node (handled via command buffer)
      if (vim.state.commandBuffer === 'z' && vimKey.key === 'z') {
        navigation.centerOnFocused();
        vim.clearCommandBuffer();
        return;
      }

      // Ctrl+o - navigate back in history
      if (vimKey.ctrl && vimKey.key === 'o') {
        vim.goBack();
        return;
      }

      // Ctrl+i - navigate forward in history
      if (vimKey.ctrl && vimKey.key === 'i') {
        vim.goForward();
        return;
      }

      // Single character commands that need buffering (g, z)
      if (vimKey.key === 'g' && vim.state.commandBuffer === '') {
        vim.appendCommandBuffer('g');
        // Clear buffer after timeout if no second key
        setTimeout(() => {
          if (vim.state.commandBuffer === 'g') {
            vim.clearCommandBuffer();
          }
        }, 1000);
        return;
      }

      if (vimKey.key === 'z' && vim.state.commandBuffer === '') {
        vim.appendCommandBuffer('z');
        // Clear buffer after timeout if no second key
        setTimeout(() => {
          if (vim.state.commandBuffer === 'z') {
            vim.clearCommandBuffer();
          }
        }, 1000);
        return;
      }
    }

  }, [vim, navigation, operations, isEditableElement, createVimKeyEvent]);

  // Attach keyboard event listener
  useEffect(() => {
    if (!vim.state.enabled) {
      return;
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [vim.state.enabled, handleKeyDown]);

  return {
    vim,
    isEditableElement,
    createVimKeyEvent
  };
};
