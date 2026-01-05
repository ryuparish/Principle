import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert
} from 'typeorm';
import { Node } from './Node.js';

@Entity('mindmaps')
export class ConceptMap {
  @PrimaryColumn('text')
  id!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', {
    default: '{"x":0,"y":0,"zoom":1}',
    transformer: {
      to: (value: any) => {
        if (value === null || value === undefined) return '{}';
        if (typeof value === 'string') return value;
        return JSON.stringify(value);
      },
      from: (value: any) => {
        if (value === null || value === undefined) return {};
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(value);
        } catch (e) {
          return { x: 0, y: 0, zoom: 1 };
        }
      },
    }
  })
  viewport!: { x: number; y: number; zoom: number };

  @Column('text', { default: 'private' })
  visibility!: 'private' | 'public' | 'unlisted';

  @Column('text', { name: 'share_slug', nullable: true, unique: true })
  shareSlug?: string;

  @Column('text', { name: 'share_token', nullable: true })
  shareToken?: string;

  @Column('datetime', { name: 'shared_at', nullable: true })
  sharedAt?: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @OneToMany(() => Node, node => node.conceptMap)
  nodes!: Node[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
