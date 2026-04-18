-- Migration 007: add updated_at to bills table
-- Needed for Edit Bill feature (cycle 6) to track edits and show "Đã sửa" badge

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Backfill existing rows so updated_at = created_at (no prior edits)
UPDATE bills SET updated_at = created_at WHERE updated_at IS NULL;

-- Create trigger to auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bills_set_updated_at ON bills;
CREATE TRIGGER bills_set_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
