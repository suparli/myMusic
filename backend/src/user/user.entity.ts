import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  // In a real application, this should be hashed.
  password: string;

  @Column({ type: 'varchar', nullable: true })
  lastPlayedTrackId: string | null;

  @Column({ type: 'float', nullable: true })
  lastPlayedPosition: number | null;
}
