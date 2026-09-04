// CORE node types
export type CORENodeType =
  | 'jot'
  | 'concept'
  | 'entity'
  | 'relation'
  | 'context'
  | 'problem'
  | 'task'
  | 'event'
  | 'theme'
  | 'insight'
  | 'graph_container';

export interface Position {
  x: number;
  y: number;
}

export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  width?: number;
  height?: number;
  fontSize?: number;
}

export interface RichTextContent {
  type: string;
  content?: any[];
  text?: string;
  marks?: any[];
}

export interface Node {
  id: string;
  conceptMapId: string;
  title: string;
  content: RichTextContent;
  position: Position;
  style: NodeStyle;
  imageIds: string[];
  tags: string[];
  nodeType: CORENodeType;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeCreateInput {
  conceptMapId: string;
  title: string;
  content?: RichTextContent;
  position: Position;
  style?: NodeStyle;
}

export interface NodeUpdateInput {
  title?: string;
  content?: RichTextContent;
  position?: Position;
  style?: NodeStyle;
  imageIds?: string[];
  tags?: string[];
}
