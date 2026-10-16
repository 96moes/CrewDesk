-- deploy/scripts/rename-group-leader-to-manager.sql
--
-- Renames groups."leaderId" to groups."managerId". The group's manager was always this column;
-- only its name changed, so the group data and the foreign key to "user" must survive intact.
--
-- Run this ONCE against an existing database, BEFORE starting the new backend build:
--
--   sudo -u postgres psql -d crewdesk -f deploy/scripts/rename-group-leader-to-manager.sql
--
-- Why it is needed: TypeORM runs with `synchronize: true` and never renames a column. Left to
-- itself it would add "managerId" and drop "leaderId" — which loses the record of who manages
-- each group, and on a table that already has rows it fails outright, because "managerId" is
-- NOT NULL and a new NOT NULL column cannot be filled for existing rows.
--
-- Safe to run more than once: if the column is already renamed it reports that and changes
-- nothing. Dropping the old user."managerId" column needs no script — that column is gone from
-- the entity, it is nullable, and nothing references it.
--
-- The stale constraint names left behind (groups_leaderId_not_null, FK_...) are cosmetic: they
-- keep enforcing the same rules after the rename, and TypeORM may recreate them on first start.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'leaderId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'managerId'
  ) THEN
    ALTER TABLE "groups" RENAME COLUMN "leaderId" TO "managerId";
    RAISE NOTICE 'renamed groups."leaderId" to groups."managerId"';
  ELSE
    RAISE NOTICE 'nothing to do: groups."managerId" is already in place';
  END IF;
END
$$;

COMMIT;
