ALTER TABLE sources
ADD COLUMN IF NOT EXISTS ingestion_status TEXT;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS ingestion_failure_reason TEXT;

UPDATE sources s
SET ingestion_status = CASE
  WHEN EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.source_id = s.id
  ) THEN 'COMPLETED'
  ELSE 'PENDING'
END
WHERE ingestion_status IS NULL;

ALTER TABLE sources
ALTER COLUMN ingestion_status SET DEFAULT 'PENDING';
