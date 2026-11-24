import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('music_tracks')
export class MusicTrack {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 120 }) title: string;
  @Column({ length: 10 }) kind: 'mp3' | 'mp4' | 'youtube';
  @Column({ type: 'text' }) url: string;
  @Column({ type: 'text', nullable: true }) publicId: string | null;
  @Column({ default: true }) active: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
@Entity('password_resets')
export class PasswordReset {
  @Column({ primary: true, length: 64 }) hash: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
}
@Entity('request_limits')
export class RequestLimit {
  @Column({ primary: true }) key: string;
  @Column({ type: 'timestamptz' }) expires: Date;
  @Column({ default: 0 }) count: number;
}
