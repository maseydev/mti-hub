-- Change the defensive default for direct User inserts.
-- Public registration is disabled; team-created users still pass an explicit role.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
