import React, { useState } from 'react';
import ConceptMapSelector from './components/ConceptMap/ConceptMapSelector';
import ConceptMapCanvas from './components/Canvas/ConceptMapCanvas';
import NodeDetailPage from './components/Node/NodeDetailPage';
import { queueApi } from './api/queue.api';

type View = 'selector' | 'canvas' | 'detail';

function App() {
  const [selectedConceptMapId, setSelectedConceptMapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [view, setView] = useState<View>('selector');
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectConceptMap = (id: string) => {
    setSelectedConceptMapId(id);
    setView('canvas');
  };

  const handleBackToConceptMaps = async () => {
    setIsSaving(true);
    try {
      await queueApi.waitEmpty();
      setSelectedConceptMapId(null);
      setSelectedNodeId(null);
      setView('selector');
    } catch (error) {
      console.error('Error waiting for queue:', error);
      setSelectedConceptMapId(null);
      setSelectedNodeId(null);
      setView('selector');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenNodeDetail = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setView('detail');
  };

  const handleBackToCanvas = () => {
    setSelectedNodeId(null);
    setView('canvas');
  };

  if (view === 'selector' || !selectedConceptMapId) {
    return <ConceptMapSelector onSelect={handleSelectConceptMap} />;
  }

  if (view === 'detail' && selectedNodeId) {
    return (
      <NodeDetailPage
        nodeId={selectedNodeId}
        onBack={handleBackToCanvas}
        onNavigateToNode={handleOpenNodeDetail}
      />
    );
  }

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleBackToConceptMaps}
          disabled={isSaving}
          className="px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : '<- Back to Concept Maps'}
        </button>
      </div>
      <ConceptMapCanvas
        conceptMapId={selectedConceptMapId}
        onOpenNodeDetail={handleOpenNodeDetail}
      />
    </div>
  );
}

export default App;
