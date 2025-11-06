import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert
} from 'typeorm';
import { Node } from './Node';

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
          console.error('Failed to parse viewport JSON:', value);
          return { x: 0, y: 0, zoom: 1 };
        }
      },
    }
  })
  viewport!: { x: number; y: number; zoom: number };

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
