import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
  BeforeInsert
} from 'typeorm';

@Entity('edges')
@Unique(['sourceNodeId', 'targetNodeId'])
@Index(['conceptMapId'])
@Index(['sourceNodeId'])
@Index(['targetNodeId'])
export class Edge {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'mindmapId' })
  conceptMapId!: string;

  @Column('text')
  sourceNodeId!: string;

  @Column('text')
  targetNodeId!: string;

  @Column('text', { nullable: true })
  label?: string;

  @Column('text', {
    default: '{}',
    transformer: {
      to: (value: any) => typeof value === 'string' ? value : JSON.stringify(value),
      from: (value: any) => typeof value === 'string' ? JSON.parse(value) : value,
    }
  })
  style!: any;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
