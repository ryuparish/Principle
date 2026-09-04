import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConceptMapNode, ConceptMapEdge, CORENodeType } from '../../types';
import { useConceptMapStore } from '../../store/conceptMapStore';
import { nodeApi } from '../../api/node.api';
import TipTapEditor from '../Editor/TipTapEditor';
import { ImageUploader } from '../ImageUploader/ImageUploader';
import { ImageGallery } from '../ImageGallery/ImageGallery';
import { ImageLightbox } from '../ImageLightbox/ImageLightbox';
import { Media } from '../../types';
import './NodeDetailPage.css';

interface NodeDetailPageProps {
  nodeId: string;
  onBack: () => void;
  onNavigateToNode: (nodeId: string) => void;
}

// Helper to validate TipTap content
const isValidTipTapContent = (content: any): boolean => {
  return content && typeof content === 'object' && content.type === 'doc' && Array.isArray(content.content);
};

const getDefaultContent = () => ({ type: 'doc', content: [] });

const NODE_TYPE_LABELS: Record<CORENodeType, string> = {
  jot: 'Jot',
  concept: 'Concept',
  entity: 'Entity',
  relation: 'Relation',
  context: 'Context',
  problem: 'Problem',
  task: 'Task',
  event: 'Event',
  theme: 'Theme',
  insight: 'Insight',
  graph_container: 'Container'
};

const NodeDetailPage: React.FC<NodeDetailPageProps> = ({ nodeId, onBack, onNavigateToNode }) => {
  const { nodes, edges, updateNode, loadNodeMedia, uploadMedia, deleteMedia } = useConceptMapStore();
  const nodeMedia = useConceptMapStore((state) => state.media[nodeId] || []);

  const node = nodes.find(n => n.id === nodeId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(getDefaultContent());
  const [nodeType, setNodeType] = useState<CORENodeType>('jot');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Initialize from node data
  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setContent(isValidTipTapContent(node.content) ? node.content : getDefaultContent());
      setNodeType(node.nodeType || 'jot');
    }
  }, [node?.id]);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { contentRef.current = content; }, [content]);

  // Load media
  useEffect(() => {
    if (nodeId) loadNodeMedia(nodeId);
  }, [nodeId, loadNodeMedia]);

  // Get connected nodes from edges
  const connectedNodes = React.useMemo(() => {
    const connections: { node: ConceptMapNode; edge: ConceptMapEdge; direction: 'outgoing' | 'incoming' }[] = [];
    for (const edge of edges) {
      if (edge.sourceNodeId === nodeId) {
        const targetNode = nodes.find(n => n.id === edge.targetNodeId);
        if (targetNode) connections.push({ node: targetNode, edge, direction: 'outgoing' });
      }
      if (edge.targetNodeId === nodeId) {
        const sourceNode = nodes.find(n => n.id === edge.sourceNodeId);
        if (sourceNode) connections.push({ node: sourceNode, edge, direction: 'incoming' });
      }
    }
    return connections;
  }, [edges, nodes, nodeId]);

  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      await updateNode(nodeId, {
        title: titleRef.current,
        content: contentRef.current
      });
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveMessage('Error saving');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [nodeId, updateNode]);

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
      saveTimeoutRef.current = null;
    }, 1000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, performSave]);

  const handleImageUpload = async (file: File) => {
    try {
      await uploadMedia(file, nodeId);
      setSaveMessage('Image uploaded');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleImageDelete = async (mediaId: string) => {
    await deleteMedia(mediaId, nodeId);
  };

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === 'Escape' && !isEditing) {
        onBack();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  if (!node) {
    return (
      <div className="node-detail-page">
        <div className="node-detail-header">
          <button onClick={onBack} className="back-button">← Back to Graph</button>
        </div>
        <div className="node-detail-empty">Node not found</div>
      </div>
    );
  }

  return (
    <div className="node-detail-page">
      <div className="node-detail-header">
        <button onClick={onBack} className="back-button">← Back to Graph</button>
        <div className="node-detail-meta">
          <span className={`node-type-badge type-${nodeType}`}>
            {NODE_TYPE_LABELS[nodeType] || nodeType}
          </span>
          {saveMessage && <span className="save-indicator">{saveMessage}</span>}
          {isSaving && !saveMessage && <span className="save-indicator saving">Saving...</span>}
        </div>
      </div>

      <div className="node-detail-content">
        <div className="node-detail-main">
          <input
            type="text"
            className="node-detail-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Node Title"
          />

          <div className="node-detail-editor">
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Write your content here..."
            />
          </div>

          {/* Images Section */}
          <div className="node-detail-images">
            <div className="section-header">
              <h3>Images</h3>
              <ImageUploader
                nodeId={nodeId}
                onUploadSuccess={handleImageUpload}
                onUploadError={(error) => console.error(error)}
              />
            </div>
            {nodeMedia.length > 0 && (
              <ImageGallery
                media={nodeMedia}
                onImageClick={(media: Media, index: number) => {
                  setLightboxIndex(index);
                  setLightboxOpen(true);
                }}
                onImageDelete={handleImageDelete}
                showDelete={true}
              />
            )}
          </div>
        </div>

        {/* Sidebar: Connected Nodes */}
        <div className="node-detail-sidebar">
          <div className="sidebar-section">
            <h3>Connected Nodes</h3>
            {connectedNodes.length === 0 ? (
              <p className="sidebar-empty">No connections yet</p>
            ) : (
              <ul className="connections-list">
                {connectedNodes.map(({ node: connNode, edge, direction }) => (
                  <li key={`${edge.id}-${connNode.id}`} className="connection-item">
                    <button
                      className="connection-link"
                      onClick={() => onNavigateToNode(connNode.id)}
                    >
                      <span className="connection-direction">
                        {direction === 'outgoing' ? '→' : '←'}
                      </span>
                      <span className="connection-title">{connNode.title || 'Untitled'}</span>
                    </button>
                    {edge.label && (
                      <span className="connection-label">{edge.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Info</h3>
            <div className="info-grid">
              <span className="info-label">Type</span>
              <span className="info-value">{NODE_TYPE_LABELS[nodeType] || nodeType}</span>
              <span className="info-label">Created</span>
              <span className="info-value">{new Date(node.createdAt).toLocaleDateString()}</span>
              <span className="info-label">Updated</span>
              <span className="info-value">{new Date(node.updatedAt).toLocaleString()}</span>
              <span className="info-label">ID</span>
              <span className="info-value info-id">{node.id}</span>
            </div>
          </div>
        </div>
      </div>

      <ImageLightbox
        media={nodeMedia}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default NodeDetailPage;
