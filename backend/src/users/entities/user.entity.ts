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
  id: string;

  @Column({
    name: 'username',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  username: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 150,
    unique: true,
  })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  firstName: string | null;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  lastName: string | null;

  @Column({
    name: 'phone',
    type: 'varchar',
    length: 30,
    nullable: true,
    unique: true,
  })
  phone: string | null;

  @Column({
    name: 'avatar_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  avatarUrl: string | null;

  @Column({
    name: 'biography',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  biography: string | null;

  @Column({
    name: 'birth_date',
    type: 'date',
    nullable: true,
  })
  birthDate: string | null;

  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 50,
    default: 'America/La_Paz',
  })
  timezone: string;

  @Column({
    name: 'language_code',
    type: 'varchar',
    length: 10,
    default: 'es',
  })
  languageCode: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: string;

  @Column({
    name: 'email_verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  emailVerifiedAt: Date | null;

  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastLoginAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}