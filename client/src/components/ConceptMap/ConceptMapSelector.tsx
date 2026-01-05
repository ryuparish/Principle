import React, { useEffect, useState } from 'react';
import { useConceptMapStore } from "../../store/conceptMapStore";
import { ImportButton } from '../Import/ImportButton';
import { ImportModal } from '../Import/ImportModal';
import { shareApi } from '../../api/share.api';

interface ConceptMapSelectorProps {
  onSelect: (conceptMapId: string) => void;
}

const ConceptMapSelector: React.FC<ConceptMapSelectorProps> = ({ onSelect }) => {
  const { conceptMaps, loadConceptMaps, createConceptMap, updateConceptMap, deleteConceptMap } = useConceptMapStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMapName, setImportMapName] = useState('');
  const [importing, setImporting] = useState(false);
  const [selectedMaps, setSelectedMaps] = useState<Set<string>>(new Set());

  // Edit modal state
  const [editingMap, setEditingMap] = useState<{ id: string; name: string; description: string } | null>(null);

  useEffect(() => {
    loadConceptMaps();
  }, []);

  const handleCreate = async () => {
    if (newName.trim()) {
      const conceptMap = await createConceptMap(newName.trim(), newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setShowCreate(false);
      onSelect(conceptMap.id);
    }
  };

  // Edit handlers
  const handleEditClick = (conceptMap: { id: string; name: string; description?: string }) => {
    setEditingMap({
      id: conceptMap.id,
      name: conceptMap.name,
      description: conceptMap.description || ''
    });
  };

  const handleEditSave = async () => {
    if (!editingMap) return;
    if (!editingMap.name.trim()) {
      alert('Name is required');
      return;
    }

    try {
      await updateConceptMap(editingMap.id, {
        name: editingMap.name.trim(),
        description: editingMap.description.trim() || undefined
      });
      setEditingMap(null);
    } catch (error) {
      alert('Failed to update concept map');
    }
  };

  const handleEditCancel = () => {
    setEditingMap(null);
  };

  const handleImportClick = async (file: File) => {
    // Read file to get map name for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Check if this is a bulk export (has 'maps' array) or single map
        if (data.maps && Array.isArray(data.maps)) {
          // Bulk import
          setImportMapName(`${data.maps.length} concept maps`);
        } else if (data.map) {
          // Single import
          setImportMapName(data.map.name || 'Unknown');
        } else {
          throw new Error('Invalid export format');
        }

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
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);

          // Check if this is a bulk export
          if (data.maps && Array.isArray(data.maps)) {
            // Bulk import - import each map
            let successCount = 0;
            let failCount = 0;

            for (const mapExport of data.maps) {
              try {
                // Create a blob for each individual map export
                const mapBlob = new Blob([JSON.stringify(mapExport)], { type: 'application/json' });
                const mapFile = new File([mapBlob], 'map.json', { type: 'application/json' });

                await shareApi.importConceptMap(mapFile);
                successCount++;
              } catch (error) {
                console.error('Failed to import one map:', error);
                failCount++;
              }
            }

            setShowImportModal(false);
            setImportFile(null);
            setImporting(false);

            // Show result
            if (failCount > 0) {
              alert(`Imported ${successCount} of ${data.maps.length} maps. ${failCount} failed.`);
            } else {
              alert(`Successfully imported ${successCount} concept maps!`);
            }

            // Refresh maps list
            await loadConceptMaps();
          } else {
            // Single import
            const newMap = await shareApi.importConceptMap(importFile);
            setShowImportModal(false);
            setImportFile(null);
            setImporting(false);

            // Refresh maps list and select new map
            await loadConceptMaps();
            onSelect(newMap.id);
          }
        } catch (error: any) {
          console.error('Import failed:', error);
          alert('Failed to import concept map(s): ' + (error.message || 'Unknown error'));
          setImporting(false);
        }
      };
      reader.readAsText(importFile);
    } catch (error: any) {
      console.error('Import failed:', error);
      alert('Failed to import concept map(s): ' + (error.message || 'Unknown error'));
      setImporting(false);
    }
  };

  const handleImportCancel = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImporting(false);
  };

  // Selection handlers
  const handleToggleSelection = (id: string) => {
    setSelectedMaps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Delete handlers
  const handleDeleteSingle = async (id: string) => {
    const conceptMap = conceptMaps.find(m => m.id === id);
    if (!conceptMap) return;

    if (!confirm(`Are you sure you want to delete "${conceptMap.name}"?`)) return;

    try {
      await deleteConceptMap(id);
    } catch (error) {
      alert('Failed to delete concept map');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedMaps.size;
    if (!confirm(`Are you sure you want to delete ${count} concept map${count > 1 ? 's' : ''}?`)) return;

    try {
      await Promise.all(
        Array.from(selectedMaps).map(id => deleteConceptMap(id))
      );
      setSelectedMaps(new Set());
    } catch (error) {
      alert('Failed to delete some concept maps');
    }
  };

  // Export handlers
  const handleExportSingle = async (id: string) => {
    try {
      const conceptMap = conceptMaps.find(m => m.id === id);
      if (!conceptMap) return;

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/mindmaps/${id}/export`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conceptMap.name.replace(/[^a-z0-9]/gi, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Export error:', error);
      alert('Failed to export concept map: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBulkExport = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const exports = await Promise.all(
        Array.from(selectedMaps).map(async (id) => {
          const response = await fetch(`${baseUrl}/api/mindmaps/${id}/export`);

          if (!response.ok) {
            throw new Error(`Export failed for map ${id}: ${response.status}`);
          }

          return await response.json();
        })
      );

      const combinedExport = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        maps: exports
      };

      const blob = new Blob([JSON.stringify(combinedExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `concept-maps-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSelectedMaps(new Set());
    } catch (error: any) {
      console.error('Bulk export error:', error);
      alert('Failed to export concept maps: ' + (error.message || 'Unknown error'));
    }
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
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleCreate()}
              autoFocus
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full px-3 py-2 border rounded mb-2 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selectedMaps.size > 0 && (
          <div className="sticky top-0 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between z-10 shadow">
            <span className="text-sm font-medium text-blue-900">
              {selectedMaps.size} map{selectedMaps.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkExport}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Export Selected ({selectedMaps.size})
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete Selected ({selectedMaps.size})
              </button>
              <button
                onClick={() => setSelectedMaps(new Set())}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
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
              className={`relative group bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition ${
                selectedMaps.has(conceptMap.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onSelect(conceptMap.id)}
            >
              {/* Selection checkbox */}
              <div
                className="absolute top-2 left-2 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedMaps.has(conceptMap.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleSelection(conceptMap.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Action buttons (shown on hover) */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(conceptMap);
                  }}
                  className="p-2 bg-white rounded-full shadow hover:bg-blue-100 text-lg"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportSingle(conceptMap.id);
                  }}
                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-lg"
                  title="Export"
                >
                  📥
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSingle(conceptMap.id);
                  }}
                  className="p-2 bg-white rounded-full shadow hover:bg-red-100 text-lg"
                  title="Delete"
                >
                  ✕
                </button>
              </div>

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

      {/* Edit Modal */}
      {editingMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Concept Map</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingMap.name}
                  onChange={(e) => setEditingMap({ ...editingMap, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Concept map name..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingMap.description}
                  onChange={(e) => setEditingMap({ ...editingMap, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Description (optional)..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleEditCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptMapSelector;
