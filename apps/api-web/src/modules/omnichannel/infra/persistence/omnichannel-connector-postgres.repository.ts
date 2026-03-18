import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../../infra/database/database.service';
import { OmnichannelConnector } from '../../domain/entities/omnichannel-connector.entity';
import { ConnectorHealthStatus } from '../../domain/enums/connector-health-status.enum';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { IConnectorRepository } from '../../domain/repositories/connector-repository.interface';

interface ConnectorRow {
  id: number;
  channel: MessageChannel;
  name: string;
  is_enabled: boolean;
  health_status: ConnectorHealthStatus;
  last_health_check_at: Date | null;
  config_snapshot: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class OmnichannelConnectorPostgresRepository implements IConnectorRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async ensureDefaults(
    connectors: Array<{ channel: MessageChannel; name: string }>,
  ): Promise<void> {
    for (const connector of connectors) {
      await this.databaseService.query(
        `
          INSERT INTO omnichannel_connectors (channel, name, is_enabled, health_status)
          VALUES ($1, $2, TRUE, 'UNKNOWN')
          ON CONFLICT (channel, name) DO NOTHING
        `,
        [connector.channel, connector.name],
      );
    }
  }

  async findMany(): Promise<OmnichannelConnector[]> {
    const rows = await this.databaseService.query<ConnectorRow>(
      `SELECT * FROM omnichannel_connectors ORDER BY channel ASC, name ASC`,
    );

    return rows.map((row) => this.mapRow(row));
  }

  async findById(connectorId: number): Promise<OmnichannelConnector | null> {
    const [row] = await this.databaseService.query<ConnectorRow>(
      `SELECT * FROM omnichannel_connectors WHERE id = $1 LIMIT 1`,
      [connectorId],
    );

    return row ? this.mapRow(row) : null;
  }

  async updateEnabled(
    connectorId: number,
    isEnabled: boolean,
  ): Promise<OmnichannelConnector | null> {
    const [row] = await this.databaseService.query<ConnectorRow>(
      `
        UPDATE omnichannel_connectors
        SET is_enabled = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [connectorId, isEnabled],
    );

    return row ? this.mapRow(row) : null;
  }

  private mapRow(row: ConnectorRow): OmnichannelConnector {
    return new OmnichannelConnector({
      id: row.id,
      channel: row.channel,
      name: row.name,
      isEnabled: row.is_enabled,
      healthStatus: row.health_status,
      lastHealthCheckAt: row.last_health_check_at
        ? new Date(row.last_health_check_at)
        : null,
      configSnapshot: row.config_snapshot,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
