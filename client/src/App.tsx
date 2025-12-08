import React, { useState } from 'react';
import ConceptMapSelector from './components/ConceptMap/ConceptMapSelector';
import ConceptMapCanvas from './components/Canvas/ConceptMapCanvas';
import ToastContainer from './components/Toast/ToastContainer';
import { queueApi } from './api/queue.api';

function App() {
  const [selectedConceptMapId, setSelectedConceptMapId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleBackToConceptMaps = async () => {
    setIsSaving(true);

    try {
      // Wait for queue to be empty before navigating
      await queueApi.waitEmpty();
      setSelectedConceptMapId(null);
    } catch (error) {
      console.error('Error waiting for queue:', error);
      setSelectedConceptMapId(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedConceptMapId) {
    return <ConceptMapSelector onSelect={setSelectedConceptMapId} />;
  }

  return (
    <>
      <ToastContainer />
      <div className="w-full h-screen relative">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleBackToConceptMaps}
            disabled={isSaving}
            className="px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '💾 Saving...' : '← Back to Concept Maps'}
          </button>
        </div>
        <ConceptMapCanvas conceptMapId={selectedConceptMapId} />
      </div>
    </>
  );
}

export default App;
