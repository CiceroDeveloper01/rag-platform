CREATE TABLE IF NOT EXISTS tenant_agents (
  tenant_id VARCHAR(120) NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  agent_name VARCHAR(120) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (tenant_id, agent_name)
);
