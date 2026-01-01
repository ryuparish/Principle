import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { shareApi } from '../api/share.api';
import { ConceptMapExport, ConceptMapNode } from '../types';
import PublicViewerNode from '../components/Node/PublicViewerNode';
import PublicNodeViewerModal from '../components/Node/PublicNodeViewerModal';
import './PublicViewer.css';

const nodeTypes = {
  custom: PublicViewerNode,
};

const PublicViewerInner: React.FC = () => {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const [data, setData] = useState<ConceptMapExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConceptMapNode | null>(null);

  useEffect(() => {
    if (!shareSlug) return;

    const loadSharedMap = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get token from URL query params if present
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || undefined;

        const mapData = await shareApi.getSharedMap(shareSlug, token);
        setData(mapData);
      } catch (err: any) {
        console.error('Failed to load shared map:', err);
        setError(err.response?.data?.error || 'Failed to load shared map');
      } finally {
        setLoading(false);
      }
    };

    loadSharedMap();
  }, [shareSlug]);

  if (loading) {
    return (
      <div className="public-viewer-loading">
        <div className="loading-spinner"></div>
        <p>Loading shared concept map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-viewer-error">
        <h1>❌ Unable to Load Map</h1>
        <p>{error}</p>
        <a href="/">Go to Home</a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="public-viewer-error">
        <h1>Map Not Found</h1>
        <a href="/">Go to Home</a>
      </div>
    );
  }

  // Convert exported data to ReactFlow format
  const nodes: Node[] = data.nodes.map((node) => ({
    id: node.id,
    type: 'custom',
    position: node.position,
    data: {
      label: node.title,
      node: node,
      onNodeClick: (clickedNode: ConceptMapNode) => {
        setSelectedNode(clickedNode);
      }
    },
  }));

  const edges: Edge[] = data.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    sourceHandle: edge.sourceHandleId,
    targetHandle: edge.targetHandleId,
    label: edge.label,
    style: edge.style,
  }));

  return (
    <div className="public-viewer">
      <div className="public-viewer-header">
        <div className="public-viewer-title">
          <h1>{data.map.name}</h1>
          {data.map.description && <p>{data.map.description}</p>}
        </div>
        <div className="public-viewer-badge">
          👁️ Read-only view
        </div>
      </div>

      <div className="public-viewer-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultViewport={data.map.viewport}
          connectionMode={ConnectionMode.Loose}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <div className="public-viewer-footer">
        <small>
          Shared {new Date(data.exportedAt).toLocaleString()} •
          {nodes.length} node{nodes.length !== 1 ? 's' : ''} •
          {edges.length} edge{edges.length !== 1 ? 's' : ''}
        </small>
      </div>

      {/* Node viewer modal */}
      <PublicNodeViewerModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};

const PublicViewer: React.FC = () => {
  return (
    <ReactFlowProvider>
      <PublicViewerInner />
    </ReactFlowProvider>
  );
};

export default PublicViewer;
