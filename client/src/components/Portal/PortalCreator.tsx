import React, { useState, useEffect } from 'react';
import { ConceptMap, ConceptMapNode } from '../../types';
import { nodeApi } from '../../api/node.api';
import './PortalCreator.css';

interface PortalCreatorProps {
  currentMapId: string;
  availableMaps: ConceptMap[];
  onCreatePortal: (targetMapId: string, targetNodeId: string) => void;
  onClose: () => void;
}

type Step = 'selectMap' | 'selectNode';

export const PortalCreator: React.FC<PortalCreatorProps> = ({
  currentMapId,
  availableMaps,
  onCreatePortal,
  onClose
}) => {
  const [step, setStep] = useState<Step>('selectMap');
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [targetNodes, setTargetNodes] = useState<ConceptMapNode[]>([]);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // Filter out current map from available maps
  const filteredMaps = availableMaps.filter(m => m.id !== currentMapId);

  useEffect(() => {
    if (step === 'selectNode' && selectedMapId) {
      loadNodesForMap(selectedMapId);
    }
  }, [step, selectedMapId]);

  const loadNodesForMap = async (mapId: string) => {
    setLoadingNodes(true);
    try {
      const nodes = await nodeApi.getByConceptMapId(mapId);
      setTargetNodes(nodes.filter(n => !n.isDeleted));
      setLoadingNodes(false);
    } catch (error) {
      console.error('Failed to load nodes:', error);
      setLoadingNodes(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 'selectMap') {
        switch (e.key) {
          case 'j':
          case 'ArrowDown':
            e.preventDefault();
            setSelectedMapIndex(i => i < filteredMaps.length - 1 ? i + 1 : i);
            break;
          case 'k':
          case 'ArrowUp':
            e.preventDefault();
            setSelectedMapIndex(i => i > 0 ? i - 1 : i);
            break;
          case 'Enter':
            e.preventDefault();
            if (filteredMaps[selectedMapIndex]) {
              setSelectedMapId(filteredMaps[selectedMapIndex].id);
              setStep('selectNode');
            }
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
        }
      } else if (step === 'selectNode') {
        switch (e.key) {
          case 'j':
          case 'ArrowDown':
            e.preventDefault();
            setSelectedNodeIndex(i => i < targetNodes.length - 1 ? i + 1 : i);
            break;
          case 'k':
          case 'ArrowUp':
            e.preventDefault();
            setSelectedNodeIndex(i => i > 0 ? i - 1 : i);
            break;
          case 'Enter':
            e.preventDefault();
            if (targetNodes[selectedNodeIndex] && selectedMapId) {
              onCreatePortal(selectedMapId, targetNodes[selectedNodeIndex].id);
            }
            break;
          case 'Escape':
            e.preventDefault();
            if (step === 'selectNode') {
              setStep('selectMap');
              setSelectedMapId(null);
              setTargetNodes([]);
            } else {
              onClose();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [step, selectedMapIndex, selectedNodeIndex, filteredMaps, targetNodes, selectedMapId, onCreatePortal, onClose]);

  return (
    <div className="portal-creator-overlay">
      <div className="portal-creator">
        <div className="portal-creator-header">
          <h3>{step === 'selectMap' ? 'Select Target Map' : 'Select Target Node'}</h3>
          <p className="portal-creator-subtitle">
            {step === 'selectMap'
              ? 'Choose the map to link to'
              : `Choose a node in "${filteredMaps[selectedMapIndex]?.name}"`
            }
          </p>
        </div>

        {step === 'selectMap' && (
          <div className="portal-creator-list">
            {filteredMaps.length === 0 ? (
              <div className="portal-creator-empty">
                No other maps available
              </div>
            ) : (
              filteredMaps.map((map, index) => (
                <div
                  key={map.id}
                  className={`portal-creator-item ${index === selectedMapIndex ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMapIndex(index);
                    setSelectedMapId(map.id);
                    setStep('selectNode');
                  }}
                >
                  <div className="portal-creator-icon">🗺️</div>
                  <div className="portal-creator-info">
                    <div className="portal-creator-name">{map.name}</div>
                    {map.description && (
                      <div className="portal-creator-description">{map.description}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step === 'selectNode' && (
          <div className="portal-creator-list">
            {loadingNodes ? (
              <div className="portal-creator-loading">Loading nodes...</div>
            ) : targetNodes.length === 0 ? (
              <div className="portal-creator-empty">
                No nodes in this map
              </div>
            ) : (
              targetNodes.map((node, index) => (
                <div
                  key={node.id}
                  className={`portal-creator-item ${index === selectedNodeIndex ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedMapId) {
                      onCreatePortal(selectedMapId, node.id);
                    }
                  }}
                >
                  <div className="portal-creator-icon">📍</div>
                  <div className="portal-creator-info">
                    <div className="portal-creator-name">{node.title}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="portal-creator-hints">
          <span><kbd>j</kbd>/<kbd>k</kbd> navigate</span>
          <span><kbd>Enter</kbd> select</span>
          <span><kbd>Esc</kbd> {step === 'selectNode' ? 'back' : 'cancel'}</span>
        </div>
      </div>
    </div>
  );
};
