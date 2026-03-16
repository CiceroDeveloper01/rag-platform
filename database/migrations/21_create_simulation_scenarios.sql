CREATE TABLE IF NOT EXISTS simulation_scenarios (
  scenario_name VARCHAR(160) PRIMARY KEY,
  input_message TEXT NOT NULL,
  expected_agent VARCHAR(120) NOT NULL,
  expected_action VARCHAR(160) NOT NULL
);
