import React, { useEffect, useState } from 'react';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { ImportButton } from '../Import/ImportButton';
import { ImportModal } from '../Import/ImportModal';
import { shareApi } from '../../api/share.api';

interface ConceptMapSelectorProps {
  onSelect: (conceptMapId: string) => void;
}

const ConceptMapSelector: React.FC<ConceptMapSelectorProps> = ({ onSelect }) => {
  const { conceptMaps, loadConceptMaps, createConceptMap } = useConceptMapStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMapName, setImportMapName] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadConceptMaps();
  }, []);

  const handleCreate = async () => {
    if (newName.trim()) {
      const conceptMap = await createConceptMap(newName.trim());
      setNewName('');
      setShowCreate(false);
      onSelect(conceptMap.id);
    }
  };

  const handleImportClick = async (file: File) => {
    // Read file to get map name for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setImportMapName(data.map?.name || 'Unknown');
        setImportFile(file);
        setShowImportModal(true);
      } catch (error) {
        console.error('Invalid JSON file:', error);
        alert('Invalid JSON file. Please select a valid concept map export.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const newMap = await shareApi.importConceptMap(importFile);
      setShowImportModal(false);
      setImportFile(null);
      setImporting(false);
      // Refresh maps list and select new map
      await loadConceptMaps();
      onSelect(newMap.id);
    } catch (error: any) {
      console.error('Import failed:', error);
      alert('Failed to import concept map: ' + (error.message || 'Unknown error'));
      setImporting(false);
    }
  };

  const handleImportCancel = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImporting(false);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Concept Maps</h1>
          <div className="flex gap-2">
            <ImportButton onImport={handleImportClick} />
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + New Concept Map
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Concept map name..."
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
          {conceptMaps.map((conceptMap) => (
            <div
              key={conceptMap.id}
              onClick={() => onSelect(conceptMap.id)}
              className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{conceptMap.name}</h3>
              {conceptMap.description && (
                <p className="text-gray-600 text-sm mb-2">{conceptMap.description}</p>
              )}
              <p className="text-gray-400 text-xs">
                Updated: {new Date(conceptMap.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {conceptMaps.length === 0 && !showCreate && (
          <div className="text-center text-gray-500 mt-12">
            <p className="text-lg">No concept maps yet. Create one to get started!</p>
          </div>
        )}
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={handleImportCancel}
        onConfirm={handleImportConfirm}
        fileName={importFile?.name || ''}
        mapName={importMapName}
        loading={importing}
      />
    </div>
  );
};

export default ConceptMapSelector;
