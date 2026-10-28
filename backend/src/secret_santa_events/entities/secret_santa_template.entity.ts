// src/secret_santa_events/entities/secret_santa_template.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Plantilla global: NO tiene participantes ni se sortea directamente. */
@Entity('secret_santa_templates')
export class SecretSantaTemplate {
  @PrimaryGeneratedColumn('uuid', { name: 'id_secret_santa_templates' })
  id: string;

  @Column({ name: 'id_users_creator', type: 'uuid' })
  creatorId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 1000, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'image_public_id', type: 'varchar', length: 255, nullable: true })
  imagePublicId: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  budget: number | null;

  @Column({ name: 'currency_code', type: 'char', length: 3, default: 'BOB' })
  currencyCode: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
