CREATE TABLE IF NOT EXISTS simulation_results (
  scenario_id VARCHAR(160) NOT NULL,
  actual_agent VARCHAR(120) NOT NULL,
  actual_action VARCHAR(160) NOT NULL,
  score VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
