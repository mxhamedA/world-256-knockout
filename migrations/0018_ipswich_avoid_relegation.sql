-- Ipswich's objective changed from a top-half finish to avoiding relegation.
-- Credit qualifying seasons that were already completed under the old rule.
UPDATE premier_league_attempts
SET achieved = 1,
  completed_at = COALESCE(completed_at, started_at)
WHERE club_id = 'ipswich-town'
  AND final_position BETWEEN 1 AND 17;
