import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('walks')
@Index(['conceptMapId'])
export class Walk {
  @PrimaryColumn('text')
  id!: string;

  @Column('text')
  conceptMapId!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}

@Entity('walk_steps')
@Index(['walkId'])
@Index(['nodeId'])
export class WalkStep {
  @PrimaryColumn('text')
  id!: string;

  @Column('text')
  walkId!: string;

  @Column('text')
  nodeId!: string;

  @Column('int')
  order!: number;

  @Column('text', { nullable: true })
  annotation!: string | null;

  @Column('float', { nullable: true, default: 1.5 })
  zoomLevel!: number | null;

  @Column('int', { nullable: true })
  duration!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
