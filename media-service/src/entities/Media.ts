import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert
} from 'typeorm';

@Entity('media')
@Index(['nodeId'])
@Index(['filename'])
export class Media {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { nullable: true })
  nodeId?: string;

  @Column('text', { unique: true, nullable: true })
  filename?: string;

  @Column('text', { nullable: true })
  thumbnailFilename?: string;

  @Column('text')
  originalName!: string;

  @Column('text')
  mimeType!: string;

  @Column('integer')
  sizeBytes!: number;

  @Column('integer', { nullable: true })
  width?: number;

  @Column('integer', { nullable: true })
  height?: number;

  @Column('text', { nullable: true })
  url?: string;

  @Column('text', { nullable: true })
  thumbnailUrl?: string;

  // S3 storage fields
  @Column('text', { nullable: true })
  s3Key?: string;

  @Column('text', { nullable: true })
  s3Url?: string;

  @Column('text', { nullable: true })
  thumbnailS3Key?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = crypto.randomUUID();
    }
  }
}
