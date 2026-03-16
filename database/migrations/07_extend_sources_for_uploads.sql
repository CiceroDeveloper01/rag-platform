ALTER TABLE sources
ADD COLUMN IF NOT EXISTS filename TEXT;

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP;

UPDATE sources
SET
  filename = COALESCE(filename, name),
  uploaded_at = COALESCE(uploaded_at, created_at, NOW());

ALTER TABLE sources
ALTER COLUMN uploaded_at SET DEFAULT NOW();
