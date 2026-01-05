import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';

@Entity('walks')
@Index(['conceptMapId'])
export class Walk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conceptMapId: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WalkStep, step => step.walk, { cascade: true, eager: true })
  steps: WalkStep[];
}

@Entity('walk_steps')
@Index(['walkId'])
@Index(['nodeId'])
export class WalkStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walkId: string;

  @Column()
  nodeId: string;

  @Column({ type: 'int' })
  order: number;

  @Column({ nullable: true, type: 'text' })
  annotation: string | null;

  @Column({ nullable: true, type: 'float', default: 1.5 })
  zoomLevel: number | null;

  @Column({ nullable: true, type: 'int' })
  duration: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Walk, walk => walk.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walkId' })
  walk: Walk;
}
