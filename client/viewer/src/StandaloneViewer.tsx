import React, { useState } from 'react';
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
import PublicViewerNode from '@/components/Node/PublicViewerNode';
import PublicNodeViewerModal from '@/components/Node/PublicNodeViewerModal';
import { EdgesProvider } from '@/contexts/EdgesContext';
import {
  SpreadBezierEdge,
  SpreadStraightEdge,
  SpreadStepEdge,
  SpreadSmoothStepEdge,
} from '@/components/Edge/SpreadEdge';
import '@/pages/PublicViewer.css';
import '@/styles/index.css';
import { ConceptMapNode } from '@/types';

const nodeTypes = {
  custom: PublicViewerNode,
};

const edgeTypes = {
  spread: SpreadBezierEdge,
  'spread-straight': SpreadStraightEdge,
  'spread-step': SpreadStepEdge,
  'spread-smoothstep': SpreadSmoothStepEdge,
};

const StandaloneViewer: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ConceptMapNode | null>(null);
  const data = window.CONCEPT_MAP_DATA;

  if (!data) {
    return (
      <div className="public-viewer-error">
        <h1>Error: No data found</h1>
        <p>This HTML file was not properly generated.</p>
      </div>
    );
  }

  const nodes: Node[] = data.nodes.map((node: ConceptMapNode) => ({
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

  // Convert edges to context format for SpreadEdge
  const edgesForContext = data.edges.map((edge: any) => ({
    id: edge.id,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    sourceHandleId: edge.sourceHandleId,
    targetHandleId: edge.targetHandleId,
  }));

  const edges: Edge[] = data.edges.map((edge: any) => {
    const style = edge.style || {};
    const strokeColor = style.strokeColor || '#b1b1b7';

    // Map path types to spread edge types
    const pathType = style.type || 'default';
    let edgeType: string;
    switch (pathType) {
      case 'straight':
        edgeType = 'spread-straight';
        break;
      case 'step':
        edgeType = 'spread-step';
        break;
      case 'smoothstep':
        edgeType = 'spread-smoothstep';
        break;
      default:
        edgeType = 'spread';
    }

    return {
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceHandle: edge.sourceHandleId,
      targetHandle: edge.targetHandleId,
      label: edge.label,
      type: edgeType,
      style: {
        stroke: strokeColor,
        strokeWidth: style.strokeWidth || 2,
        strokeDasharray: style.strokeDasharray,
      },
    };
  });

  const downloadJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.map.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ReactFlowProvider>
      <EdgesProvider edges={edgesForContext}>
        <div className="public-viewer">
          <div className="public-viewer-header">
            <div className="public-viewer-title">
              <h1>{data.map.name}</h1>
              {data.map.description && <p>{data.map.description}</p>}
            </div>
            <button
              onClick={downloadJSON}
              style={{
                padding: '8px 16px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              📄 Export JSON
            </button>
            <div className="public-viewer-badge">
              👁️ Standalone Viewer
            </div>
          </div>

          <div className="public-viewer-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
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
              Exported {new Date(data.exportedAt).toLocaleString()} •
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} •
              {edges.length} edge{edges.length !== 1 ? 's' : ''} •
              Standalone HTML Viewer
            </small>
          </div>

          <PublicNodeViewerModal
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </EdgesProvider>
    </ReactFlowProvider>
  );
};

export default StandaloneViewer;
