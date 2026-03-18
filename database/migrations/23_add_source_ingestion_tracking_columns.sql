ALTER TABLE sources
ADD COLUMN IF NOT EXISTS ingestion_current_step TEXT;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS source_channel TEXT;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE sources
SET updated_at = COALESCE(updated_at, uploaded_at, created_at, NOW())
WHERE updated_at IS NULL;

UPDATE sources
SET completed_at = COALESCE(completed_at, uploaded_at, created_at, NOW())
WHERE ingestion_status = 'COMPLETED'
  AND completed_at IS NULL;
