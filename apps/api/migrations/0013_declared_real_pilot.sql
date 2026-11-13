-- Pilot grades (spec grades des pilotes): the declared beginner / intermediate / advanced levels
-- are replaced by the rank earned with valid flights; only « real pilot » (declared) remains.
UPDATE "pilot_profiles" SET "level" = NULL WHERE "level" IS DISTINCT FROM 'realPilot';
