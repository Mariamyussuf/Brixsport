-- Migration: Rename Match foreign key constraints to match camelCase columns
-- Ensures Supabase relationship names align with application queries

BEGIN;

DO $$
DECLARE
    mapping RECORD;
    current_name TEXT;
BEGIN
    FOR mapping IN
        SELECT column_name, desired_name
        FROM (
            VALUES
                ('homeTeamId', 'Match_homeTeamId_fkey'),
                ('awayTeamId', 'Match_awayTeamId_fkey'),
                ('competitionId', 'Match_competitionId_fkey')
        ) AS constraint_map(column_name, desired_name)
    LOOP
        -- Find the existing foreign key constraint for the column
        SELECT con.conname
        INTO current_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'Match'
          AND con.contype = 'f'
          AND att.attname = mapping.column_name
        ORDER BY con.oid
        LIMIT 1;

        -- Skip if no constraint or already correct name
        IF current_name IS NULL OR current_name = mapping.desired_name THEN
            CONTINUE;
        END IF;

        BEGIN
            EXECUTE format('ALTER TABLE "Match" RENAME CONSTRAINT %I TO %I', current_name, mapping.desired_name);
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Constraint % already exists, skipping rename from %', mapping.desired_name, current_name;
            WHEN undefined_object THEN
                RAISE NOTICE 'Constraint % no longer exists, skipping', current_name;
            WHEN others THEN
                RAISE NOTICE 'Skipping rename from % to % due to error: %', current_name, mapping.desired_name, SQLERRM;
        END;
    END LOOP;
END;
$$;

COMMIT;
