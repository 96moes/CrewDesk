-- deploy/scripts/migrate-roles-to-user.sql
--
-- One-off data migration: the API used to have three roles (REGISTRAR, REPORT_VIEWER, ADMIN)
-- and now has two (USER, ADMIN). Every account that held a legacy role becomes USER; ADMIN is
-- left alone, because only ADMIN ever granted any extra permission.
--
-- Run this ONCE against an existing database, BEFORE starting the new backend build:
--
--   sudo -u postgres psql -d crewdesk -f deploy/scripts/migrate-roles-to-user.sql
--
-- Why it is needed at all: the role column is a PostgreSQL enum (user_role_enum) whose old
-- values still exist in the type. TypeORM runs with `synchronize: true`, and the new entity
-- declares only USER and ADMIN, so on startup it would try to convert the column and fail on
-- the rows that still hold a removed value. Converting them first makes startup a no-op.
--
-- The whole migration is one transaction, and it is safe to run more than once: if no legacy
-- value is present in the type it reports that and changes nothing.

BEGIN;

DO $$
DECLARE
  legacy_labels text;
BEGIN
  SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
    INTO legacy_labels
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
   WHERE t.typname = 'user_role_enum'
     AND e.enumlabel IN ('REGISTRAR', 'REPORT_VIEWER');

  IF legacy_labels IS NULL THEN
    RAISE NOTICE 'nothing to do: user_role_enum has no legacy roles left';
    RETURN;
  END IF;

  RAISE NOTICE 'converting legacy roles (%) to USER', legacy_labels;

  -- Rebuild the type rather than trying to remove values from it: PostgreSQL cannot drop a
  -- value from an enum, and adding USER while leaving the old labels behind would keep the
  -- column able to hold values the new code cannot represent.
  ALTER TABLE "user" ALTER COLUMN role DROP DEFAULT;
  ALTER TYPE user_role_enum RENAME TO user_role_enum_legacy;
  CREATE TYPE user_role_enum AS ENUM ('USER', 'ADMIN');
  ALTER TABLE "user"
    ALTER COLUMN role TYPE user_role_enum
    USING (CASE WHEN role::text = 'ADMIN' THEN 'ADMIN' ELSE 'USER' END)::user_role_enum;
  ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'USER';
  DROP TYPE user_role_enum_legacy;

  RAISE NOTICE 'done: user_role_enum is now (USER, ADMIN) with default USER';
END
$$;

COMMIT;
