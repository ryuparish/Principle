import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert
} from 'typeorm';
import { ConceptMap } from './ConceptMap';

@Entity('nodes')
@Index(['conceptMapId'])
@Index(['title'])
@Index(['isDeleted'])
export class Node {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'mindmapId' })
  conceptMapId!: string;

  @Column('text')
  title!: string;

  @Column('text', {
    default: '{}',
    transformer: {
      to: (value: any) => typeof value === 'string' ? value : JSON.stringify(value),
      from: (value: any) => typeof value === 'string' ? JSON.parse(value) : value,
    }
  })
  content!: any;

  @Column('text', {
    transformer: {
      to: (value: any) => typeof value === 'string' ? value : JSON.stringify(value),
      from: (value: any) => typeof value === 'string' ? JSON.parse(value) : value,
    }
  })
  position!: { x: number; y: number };

  @Column('text', {
    default: '{}',
    transformer: {
      to: (value: any) => typeof value === 'string' ? value : JSON.stringify(value),
      from: (value: any) => typeof value === 'string' ? JSON.parse(value) : value,
    }
  })
  style!: any;

  @Column('text', {
    default: '[]',
    transformer: {
      to: (value: any) => typeof value === 'string' ? value : JSON.stringify(value),
      from: (value: any) => typeof value === 'string' ? JSON.parse(value) : value,
    }
  })
  imageIds!: string[];

  @Column('text', {
    default: '[]',
    transformer: {
      to: (value: any) => typeof value === 'string' ? value : JSON.stringify(value),
      from: (value: any) => typeof value === 'string' ? JSON.parse(value) : value,
    }
  })
  tags!: string[];

  @Column('text', { default: 'rounded-rectangle' })
  shape!: string;

  // Portal-specific fields
  @Column('text', { name: 'node_type', default: 'regular' })
  nodeType!: 'regular' | 'portal';

  @Column('text', { name: 'portal_target_map_id', nullable: true })
  portalTargetMapId?: string;

  @Column('text', { name: 'portal_target_node_id', nullable: true })
  portalTargetNodeId?: string;

  @Column('text', { name: 'portal_source_map_id', nullable: true })
  portalSourceMapId?: string;

  @Column('text', { name: 'portal_source_node_id', nullable: true })
  portalSourceNodeId?: string;

  @Column('boolean', { default: false })
  isDeleted!: boolean;

  @Column('datetime', { nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @ManyToOne(() => ConceptMap, conceptMap => conceptMap.nodes, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'mindmapId' })
  conceptMap!: ConceptMap;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
