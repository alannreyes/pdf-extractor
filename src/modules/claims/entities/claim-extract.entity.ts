import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('claimextract')
export class ClaimExtract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column('text')
  prompt: string;

  @Column('text')
  example: string;

  @Column()
  fieldname: string;

  @Column({ name: 'created_at' })
  createdAt: Date;
} 