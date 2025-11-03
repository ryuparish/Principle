import React, { useEffect, useState } from 'react';
import { useMindmapStore } from '../../store/mindmapStore';

interface MindmapSelectorProps {
  onSelect: (mindmapId: string) => void;
}

const MindmapSelector: React.FC<MindmapSelectorProps> = ({ onSelect }) => {
  const { mindmaps, loadMindmaps, createMindmap } = useMindmapStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadMindmaps();
  }, []);

  const handleCreate = async () => {
    if (newName.trim()) {
      const mindmap = await createMindmap(newName.trim());
      setNewName('');
      setShowCreate(false);
      onSelect(mindmap.id);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Mindmaps</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + New Mindmap
          </button>
        </div>

        {showCreate && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Mindmap name..."
              className="w-full px-3 py-2 border rounded mb-2"
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mindmaps.map((mindmap) => (
            <div
              key={mindmap.id}
              onClick={() => onSelect(mindmap.id)}
              className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{mindmap.name}</h3>
              {mindmap.description && (
                <p className="text-gray-600 text-sm mb-2">{mindmap.description}</p>
              )}
              <p className="text-gray-400 text-xs">
                Updated: {new Date(mindmap.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {mindmaps.length === 0 && !showCreate && (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-lg">No mindmaps yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MindmapSelector;
