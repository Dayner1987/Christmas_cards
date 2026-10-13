-- Aplicar SOLO tras realizar respaldo de PostgreSQL y con DB_SYNCHRONIZE=false.
-- Los nombres de tablas/columnas coinciden con las entidades de src recibidas.
-- Esta migración es aditiva; no borra usuarios ni asignaciones existentes.
BEGIN;

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS image_public_id varchar(255),
  ADD COLUMN IF NOT EXISTS theme_color varchar(7) NOT NULL DEFAULT '#7657D5';

ALTER TABLE cards
  ALTER COLUMN front_image_url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS front_image_public_id varchar(255),
  ADD COLUMN IF NOT EXISTS background_image_public_id varchar(255),
  ADD COLUMN IF NOT EXISTS preview_image_public_id varchar(255);

ALTER TABLE secret_santa_events
  ADD COLUMN IF NOT EXISTS image_url varchar(1000),
  ADD COLUMN IF NOT EXISTS image_public_id varchar(255);

ALTER TABLE wishlist_items
  ADD COLUMN IF NOT EXISTS image_public_id varchar(255);

ALTER TABLE group_members
  ALTER COLUMN id_users DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name varchar(80),
  ADD COLUMN IF NOT EXISTS guest_access_hash varchar(64),
  ADD COLUMN IF NOT EXISTS guest_wishlist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS guest_avatar_url varchar(1000),
  ADD COLUMN IF NOT EXISTS guest_avatar_public_id varchar(255);

CREATE UNIQUE INDEX IF NOT EXISTS uk_group_members_guest_access_hash
  ON group_members (guest_access_hash);

ALTER TABLE secret_santa_assignments
  ALTER COLUMN id_users_giver DROP NOT NULL,
  ALTER COLUMN id_users_receiver DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS id_group_members_giver uuid,
  ADD COLUMN IF NOT EXISTS id_group_members_receiver uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uk_secret_santa_assignments_giver_member
  ON secret_santa_assignments (id_secret_santa_events, id_group_members_giver);
CREATE UNIQUE INDEX IF NOT EXISTS uk_secret_santa_assignments_receiver_member
  ON secret_santa_assignments (id_secret_santa_events, id_group_members_receiver);

-- Backfill de sorteos antiguos: preserva los UUID y las parejas existentes.
UPDATE secret_santa_assignments a
SET id_group_members_giver = m.id_group_members
FROM secret_santa_events e JOIN group_members m ON m.id_groups = e.id_groups
WHERE a.id_secret_santa_events = e.id_secret_santa_events
  AND a.id_users_giver = m.id_users
  AND a.id_group_members_giver IS NULL;

UPDATE secret_santa_assignments a
SET id_group_members_receiver = m.id_group_members
FROM secret_santa_events e JOIN group_members m ON m.id_groups = e.id_groups
WHERE a.id_secret_santa_events = e.id_secret_santa_events
  AND a.id_users_receiver = m.id_users
  AND a.id_group_members_receiver IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_secret_santa_assignments_giver_member') THEN
    ALTER TABLE secret_santa_assignments
      ADD CONSTRAINT fk_secret_santa_assignments_giver_member
      FOREIGN KEY (id_group_members_giver) REFERENCES group_members(id_group_members) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_secret_santa_assignments_receiver_member') THEN
    ALTER TABLE secret_santa_assignments
      ADD CONSTRAINT fk_secret_santa_assignments_receiver_member
      FOREIGN KEY (id_group_members_receiver) REFERENCES group_members(id_group_members) ON DELETE RESTRICT;
  END IF;
END $$;

COMMIT;
