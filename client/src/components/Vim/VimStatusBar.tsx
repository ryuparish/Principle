import React from 'react';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { VimState } from '../../types/vim.types';
import './VimStatusBar.css';

interface VimStatusBarProps {
  vimState: VimState;
}

const VimStatusBar: React.FC<VimStatusBarProps> = ({ vimState }) => {
  const { edges } = useConceptMapStore();

  if (!vimState.enabled) {
    return null;
  }

  const getModeDisplay = () => {
    switch (vimState.mode) {
      case 'normal':
        return '-- NORMAL --';
      case 'insert':
        return '-- INSERT --';
      case 'visual':
        return '-- VISUAL --';
      case 'edge':
        return '-- EDGE --';
      case 'edgeEdit':
        return '-- EDGE EDIT --';
      case 'command':
        return vimState.search.active ? '-- SEARCH --' : '-- COMMAND --';
      case 'move':
        return '-- MOVE --';
      default:
        return '';
    }
  };

  const getModeClass = () => {
    return `vim-mode-${vimState.mode}`;
  };

  const getCommandBuffer = () => {
    if (vimState.mode === 'command') {
      if (vimState.search.active) {
        return `/${vimState.search.query}`;
      }
      return `:${vimState.commandInput}`;
    }

    if (vimState.commandBuffer) {
      return vimState.commandBuffer;
    }

    if (vimState.operatorPending) {
      return `${vimState.operatorPending}_`;
    }

    return '';
  };

  const getFocusInfo = () => {
    const parts: string[] = [];

    if (vimState.focusedNodeId) {
      parts.push(`Focus: ${vimState.focusedNodeId.slice(0, 8)}`);
    }

    if (vimState.selectedNodeIds.size > 0) {
      parts.push(`Selected: ${vimState.selectedNodeIds.size}`);
    }

    if (vimState.search.active && vimState.search.results.length > 0) {
      parts.push(`Match ${vimState.search.currentIndex + 1}/${vimState.search.results.length}`);
    }

    return parts.join(' | ');
  };

  const getEdgeModeInfo = () => {
    if (vimState.edgeMode.active) {
      return `Source: ${vimState.edgeMode.sourceNodeId?.slice(0, 8)} → Target: ${vimState.edgeMode.targetNodeId?.slice(0, 8) || '...'}`;
    }
    return '';
  };

  const getEdgeEditModeInfo = () => {
    if (vimState.edgeEditMode.active) {
      const { edgeIds, selectedIndex, nodeId } = vimState.edgeEditMode;
      if (edgeIds.length === 0) return 'No edges connected';

      const selectedEdge = edges.find(e => e.id === edgeIds[selectedIndex]);
      if (!selectedEdge) return '';

      const sourceId = selectedEdge.sourceNodeId.slice(0, 8);
      const targetId = selectedEdge.targetNodeId.slice(0, 8);

      return `Node: ${nodeId?.slice(0, 8)} | Edges: ${edgeIds.length} | [${selectedIndex + 1}/${edgeIds.length}] ${sourceId} → ${targetId}`;
    }
    return '';
  };

  return (
    <div className={`vim-status-bar ${getModeClass()}`}>
      <div className="vim-status-left">
        <span className="vim-mode-indicator">{getModeDisplay()}</span>
        {vimState.edgeMode.active && (
          <span className="vim-edge-info">{getEdgeModeInfo()}</span>
        )}
        {vimState.edgeEditMode.active && (
          <span className="vim-edge-info">{getEdgeEditModeInfo()}</span>
        )}
      </div>

      <div className="vim-status-center">
        {getCommandBuffer() && (
          <span className="vim-command-buffer">{getCommandBuffer()}</span>
        )}
      </div>

      <div className="vim-status-right">
        <span className="vim-info">{getFocusInfo()}</span>
        <button
          className="vim-toggle-btn"
          onClick={() => {/* Will be connected to toggle handler */}}
          title="Toggle Vim Mode (Ctrl+;)"
        >
          VIM
        </button>
      </div>
    </div>
  );
};

export default VimStatusBar;
