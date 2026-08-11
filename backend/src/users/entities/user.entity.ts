import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid', {
    name: 'id_users',
  })
  id_users: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
  })
  password_hash: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  first_name: string | null;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  last_name: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    unique: true,
  })
  phone: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatar_url: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  biography: string | null;

  @Column({
    type: 'date',
    nullable: true,
  })
  birth_date: Date | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'America/La_Paz',
  })
  timezone: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'es',
  })
  language_code: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'CLIENT',
  })
  role: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  email_verified_at: Date | null;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  last_login_at: Date | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updated_at: Date;
}