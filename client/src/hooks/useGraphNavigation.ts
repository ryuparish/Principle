import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useMindmapStore } from '../store/mindmapStore';
import {
  findNodeInDirection,
  findNextConnectedNode,
  findFirstNode,
  findLastNode,
  findParentNodes,
  findChildNodes,
  getNodeCenter
} from '../services/navigationEngine';
import { useVimMode } from './useVimMode';

/**
 * Graph navigation hook
 * Provides high-level navigation functions for vim mode
 */
export const useGraphNavigation = () => {
  const { getNodes, setCenter } = useReactFlow();
  const { edges } = useMindmapStore();
  const vim = useVimMode();

  // Navigate in spatial direction (h/j/k/l)
  const navigateDirection = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    console.log('[NAV] navigateDirection called:', direction);
    const currentNodeId = vim.state.focusedNodeId;
    console.log('[NAV] Current node:', currentNodeId);

    if (!currentNodeId) {
      // No focus yet, focus first node
      const firstNodeId = findFirstNode(getNodes());
      console.log('[NAV] No focus, using first node:', firstNodeId);
      if (firstNodeId) {
        vim.setFocus(firstNodeId);
      }
      return;
    }

    const nodes = getNodes();
    console.log('[NAV] Total nodes:', nodes.length);
    const nextNodeId = findNodeInDirection(currentNodeId, direction, nodes);
    console.log('[NAV] Next node found:', nextNodeId);

    if (nextNodeId) {
      vim.setFocus(nextNodeId);

      // In visual mode, add to selection
      if (vim.state.mode === 'visual') {
        console.log('[NAV] Visual mode - adding to selection:', nextNodeId);
        vim.addSelection(nextNodeId);
      }
    } else {
      console.log('[NAV] No node found in direction:', direction);
    }
  }, [vim, getNodes]);

  // Navigate to next/previous connected node (Tab/Shift+Tab)
  const navigateConnected = useCallback((reverse: boolean = false) => {
    const currentNodeId = vim.state.focusedNodeId;
    if (!currentNodeId) {
      const firstNodeId = findFirstNode(getNodes());
      if (firstNodeId) {
        vim.setFocus(firstNodeId);
      }
      return;
    }

    const nextNodeId = findNextConnectedNode(currentNodeId, edges, reverse);
    if (nextNodeId) {
      vim.setFocus(nextNodeId);

      // In visual mode, add to selection
      if (vim.state.mode === 'visual') {
        vim.addSelection(nextNodeId);
      }
    }
  }, [vim, getNodes, edges]);

  // Jump to first node (gg)
  const jumpToFirst = useCallback(() => {
    const firstNodeId = findFirstNode(getNodes());
    if (firstNodeId) {
      vim.setFocus(firstNodeId);

      // In visual mode, select all nodes between anchor and target
      if (vim.state.mode === 'visual' && vim.state.visualModeAnchor) {
        // For now, just add to selection
        vim.addSelection(firstNodeId);
      }
    }
  }, [vim, getNodes]);

  // Jump to last node (G)
  const jumpToLast = useCallback(() => {
    const lastNodeId = findLastNode(getNodes());
    if (lastNodeId) {
      vim.setFocus(lastNodeId);

      // In visual mode, add to selection
      if (vim.state.mode === 'visual' && vim.state.visualModeAnchor) {
        vim.addSelection(lastNodeId);
      }
    }
  }, [vim, getNodes]);

  // Center viewport on focused node (zz)
  const centerOnFocused = useCallback(() => {
    const currentNodeId = vim.state.focusedNodeId;
    if (!currentNodeId) return;

    const center = getNodeCenter(currentNodeId, getNodes());
    if (center) {
      setCenter(center.x, center.y, { zoom: 1, duration: 300 });
    }
  }, [vim.state.focusedNodeId, getNodes, setCenter]);

  // Navigate to parent node ({)
  const navigateToParent = useCallback(() => {
    const currentNodeId = vim.state.focusedNodeId;
    if (!currentNodeId) return;

    const parents = findParentNodes(currentNodeId, edges);
    if (parents.length > 0) {
      vim.setFocus(parents[0]);

      if (vim.state.mode === 'visual') {
        vim.addSelection(parents[0]);
      }
    }
  }, [vim, edges]);

  // Navigate to child node (})
  const navigateToChild = useCallback(() => {
    const currentNodeId = vim.state.focusedNodeId;
    if (!currentNodeId) return;

    const children = findChildNodes(currentNodeId, edges);
    if (children.length > 0) {
      vim.setFocus(children[0]);

      if (vim.state.mode === 'visual') {
        vim.addSelection(children[0]);
      }
    }
  }, [vim, edges]);

  // Navigate to next child (w)
  const navigateToNextChild = useCallback(() => {
    const currentNodeId = vim.state.focusedNodeId;
    if (!currentNodeId) return;

    const children = findChildNodes(currentNodeId, edges);
    if (children.length > 0) {
      // Sort children for consistent navigation
      children.sort();
      vim.setFocus(children[0]);

      if (vim.state.mode === 'visual') {
        vim.addSelection(children[0]);
      }
    }
  }, [vim, edges]);

  // Navigate to previous parent (b)
  const navigateToPrevParent = useCallback(() => {
    const currentNodeId = vim.state.focusedNodeId;
    if (!currentNodeId) return;

    const parents = findParentNodes(currentNodeId, edges);
    if (parents.length > 0) {
      // Sort parents for consistent navigation
      parents.sort();
      vim.setFocus(parents[parents.length - 1]);

      if (vim.state.mode === 'visual') {
        vim.addSelection(parents[parents.length - 1]);
      }
    }
  }, [vim, edges]);

  // Focus on a specific node (used by search, marks, etc.)
  const focusNode = useCallback((nodeId: string) => {
    vim.setFocus(nodeId);

    // Center on node
    const center = getNodeCenter(nodeId, getNodes());
    if (center) {
      setCenter(center.x, center.y, { zoom: 1, duration: 300 });
    }
  }, [vim, getNodes, setCenter]);

  // Auto-focus first node if nothing is focused
  const ensureFocus = useCallback(() => {
    if (!vim.state.focusedNodeId) {
      const firstNodeId = findFirstNode(getNodes());
      if (firstNodeId) {
        vim.setFocus(firstNodeId);
      }
    }
  }, [vim, getNodes]);

  return {
    navigateDirection,
    navigateConnected,
    jumpToFirst,
    jumpToLast,
    centerOnFocused,
    navigateToParent,
    navigateToChild,
    navigateToNextChild,
    navigateToPrevParent,
    focusNode,
    ensureFocus
  };
};
