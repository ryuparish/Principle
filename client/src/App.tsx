import React, { useState } from 'react';
import MindmapSelector from './components/Mindmap/MindmapSelector';
import MindMapCanvas from './components/Canvas/MindMapCanvas';
import { queueApi } from './api/queue.api';

function App() {
  const [selectedMindmapId, setSelectedMindmapId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleBackToMindmaps = async () => {
    setIsSaving(true);

    try {
      // Wait for queue to be empty before navigating
      await queueApi.waitEmpty();
      setSelectedMindmapId(null);
    } catch (error) {
      console.error('Error waiting for queue:', error);
      setSelectedMindmapId(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedMindmapId) {
    return <MindmapSelector onSelect={setSelectedMindmapId} />;
  }

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleBackToMindmaps}
          disabled={isSaving}
          className="px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '💾 Saving...' : '← Back to Mindmaps'}
        </button>
      </div>
      <MindMapCanvas mindmapId={selectedMindmapId} />
    </div>
  );
}

export default App;
