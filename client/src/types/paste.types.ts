/**
 * Paste shape types for multi-node paste operations
 */

export type PasteShape = 'grid' | 'tree' | 'line' | 'radial' | 'cluster';

export interface PasteShapeOption {
  id: PasteShape;
  name: string;
  description: string;
}

export const PASTE_SHAPE_OPTIONS: PasteShapeOption[] = [
  {
    id: 'grid',
    name: 'Grid',
    description: 'Grid layout for organized structures'
  },
  {
    id: 'tree',
    name: 'Tree',
    description: 'Hierarchical tree structure'
  },
  {
    id: 'line',
    name: 'Line',
    description: 'Horizontal line for sequences'
  },
  {
    id: 'radial',
    name: 'Radial',
    description: 'Radial pattern from center'
  },
  {
    id: 'cluster',
    name: 'Cluster',
    description: 'Clustered around center point'
  }
];
