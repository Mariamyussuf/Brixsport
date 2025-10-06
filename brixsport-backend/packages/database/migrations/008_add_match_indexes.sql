DO $$
DECLARE
    match_competition_col TEXT;
    match_scheduled_col TEXT;
BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_status_v2 ON "Match" (status)';

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'competition_id'
    ) THEN 'competition_id' ELSE '"competitionId"' END
    INTO match_competition_col;

    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Match'
          AND column_name = 'scheduled_at'
    ) THEN 'scheduled_at' ELSE '"startTime"' END
    INTO match_scheduled_col;

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_competition_v2 ON "Match" (%s);', match_competition_col);
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_sport_v2 ON "Match" (sport)';
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at_v2 ON "Match" (%s);', match_scheduled_col);

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_matches_status_sport_v2 ON "Match" (status, sport)';
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_matches_competition_status_v2 ON "Match" (%s, status);', match_competition_col);
END;
$$;
