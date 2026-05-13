import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: 'Unknown Artist' })
  artist: string;

  @Column({ type: 'varchar', nullable: true })
  album: string | null;

  @Column({ type: 'varchar', nullable: true })
  playlist: string | null;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({ type: 'float', nullable: true })
  duration: number | null;

  @Column()
  path: string;

  @Column()
  filename: string;

  @CreateDateColumn()
  createdAt: Date;
}
