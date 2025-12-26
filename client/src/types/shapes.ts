import { Position } from 'reactflow';

// Handle offset configuration for fine-tuning handle positions
export interface HandleOffsets {
  top?: { x?: string; y?: string };     // e.g., { y: '13%' } to shift down
  right?: { x?: string; y?: string };   // e.g., { x: '-5%' } to shift left
  bottom?: { x?: string; y?: string };  // e.g., { y: '-10%' } to shift up
  left?: { x?: string; y?: string };    // e.g., { x: '5%' } to shift right
}

export type NodeShape =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'cylinder'
  | 'hexagon'
  | 'diamond'
  | 'parallelogram'
  | 'cloud'
  | 'actor'
  | 'document'
  | 'queue'
  | 'storage';

export interface ShapeConfig {
  name: string;
  description: string;
  category: 'basic' | 'compute' | 'data' | 'flow' | 'external';
  handles: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
  handleOffsets?: HandleOffsets;  // Per-shape handle position adjustments
  cssClass?: string;              // For shape container styling
  useSvg?: boolean;               // Whether to use SVG rendering
  contentClass?: string;          // For content positioning
}

export const SHAPE_CONFIGS: Record<NodeShape, ShapeConfig> = {
  'rectangle': {
    name: 'Rectangle',
    description: 'Standard service/component',
    category: 'basic',
    handles: { top: true, right: true, bottom: true, left: true },
    cssClass: 'shape-rectangle',
    useSvg: false
  },
  'rounded-rectangle': {
    name: 'Rounded Rectangle',
    description: 'Friendly service (default)',
    category: 'basic',
    handles: { top: true, right: true, bottom: true, left: true },
    cssClass: 'shape-rounded-rectangle',
    useSvg: false
  },
  'circle': {
    name: 'Circle',
    description: 'User/endpoint',
    category: 'flow',
    handles: { top: true, right: true, bottom: true, left: true },
    cssClass: 'shape-circle',
    useSvg: false
  },
  'cylinder': {
    name: 'Cylinder',
    description: 'Database',
    category: 'data',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'cylinder-content'
  },
  'hexagon': {
    name: 'Hexagon',
    description: 'API gateway',
    category: 'compute',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'hexagon-content'
  },
  'diamond': {
    name: 'Diamond',
    description: 'Decision point/cache',
    category: 'flow',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'diamond-content'
  },
  'parallelogram': {
    name: 'Parallelogram',
    description: 'Input/output',
    category: 'flow',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'parallelogram-content'
  },
  'cloud': {
    name: 'Cloud',
    description: 'External service',
    category: 'external',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'cloud-content'
  },
  'actor': {
    name: 'Actor',
    description: 'User persona',
    category: 'external',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'actor-content'
  },
  'document': {
    name: 'Document',
    description: 'Files/docs',
    category: 'data',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'document-content'
  },
  'queue': {
    name: 'Queue',
    description: 'Message queue',
    category: 'compute',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'queue-content'
  },
  'storage': {
    name: 'Storage',
    description: 'File storage',
    category: 'data',
    handles: { top: true, right: true, bottom: true, left: true },
    useSvg: true,
    cssClass: 'shape-svg',
    contentClass: 'storage-content'
  }
};
