import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseService } from '../infra/database/database.service';

const ZERO_VECTOR = `[${new Array<number>(1536).fill(0).join(',')}]`;

@Injectable()
export class SeedService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SeedService.name);
  }

  async run(): Promise<void> {
    if (!this.databaseService.isEnabled) {
      this.logger.warn('Seed skipped because database is disabled');
      return;
    }

    await this.databaseService.transaction(async (database) => {
      const demoUserEmail = this.configService.get<string>(
        'auth.demoUserEmail',
        'demo@ragplatform.dev',
      );
      const demoUserPassword = this.configService.get<string>(
        'auth.demoUserPassword',
        'demo123',
      );
      const demoUserName = this.configService.get<string>(
        'auth.demoUserName',
        'Demo Operator',
      );
      const passwordHash = createHash('sha256')
        .update(demoUserPassword)
        .digest('hex');

      const [user] = await database.query<{ id: number }>(
        `
          INSERT INTO users (email, password_hash, full_name, role)
          VALUES ($1, $2, $3, 'admin')
          ON CONFLICT (email) DO UPDATE
          SET full_name = EXCLUDED.full_name
          RETURNING id
        `,
        [demoUserEmail, passwordHash, demoUserName],
      );

      const [conversation] = await database.query<{ id: number }>(
        `
          INSERT INTO conversations (user_id, title)
          VALUES ($1, 'Demo onboarding conversation')
          RETURNING id
        `,
        [user.id],
      );

      await database.query(
        `
          INSERT INTO conversation_messages (conversation_id, role, content)
          VALUES
            ($1, 'user', 'How does the omnichannel RAG gateway work?'),
            ($1, 'assistant', 'It normalizes inbound messages, optionally retrieves context, and dispatches responses through the correct channel.')
        `,
        [conversation.id],
      );

      const [source] = await database.query<{ id: number }>(
        `
          INSERT INTO sources (name, filename, type)
          VALUES ('demo-handbook.pdf', 'demo-handbook.pdf', 'application/pdf')
          RETURNING id
        `,
      );

      await database.query(
        `
          INSERT INTO documents (source_id, content, embedding, metadata)
          VALUES (
            $1,
            'The omnichannel gateway normalizes channel payloads and routes them through RAG-aware orchestration.',
            $2::vector,
            $3::jsonb
          )
        `,
        [
          source.id,
          ZERO_VECTOR,
          JSON.stringify({ filename: 'demo-handbook.pdf', seeded: true }),
        ],
      );

      const [message] = await database.query<{ id: number }>(
        `
          INSERT INTO omnichannel_messages (
            external_message_id,
            conversation_id,
            channel,
            direction,
            sender_id,
            sender_name,
            sender_address,
            recipient_address,
            subject,
            body,
            normalized_text,
            metadata,
            status,
            received_at,
            processed_at
          ) VALUES (
            'demo-telegram-message-1',
            'demo-chat-1',
            'TELEGRAM',
            'INBOUND',
            '1001',
            'Demo Operator',
            'demo@telegram',
            'rag-platform-bot',
            NULL,
            'Can you summarize the platform?',
            'can you summarize the platform',
            $1::jsonb,
            'PROCESSED',
            NOW(),
            NOW()
          )
          RETURNING id
        `,
        [JSON.stringify({ seeded: true, updateId: 1 })],
      );

      await database.query(
        `
          INSERT INTO omnichannel_executions (
            message_id,
            trace_id,
            span_id,
            agent_name,
            used_rag,
            rag_query,
            model_name,
            input_tokens,
            output_tokens,
            latency_ms,
            status,
            started_at,
            finished_at,
            error_message
          ) VALUES (
            $1,
            'demo-trace-id',
            'demo-span-id',
            'rag-agent',
            true,
            'summarize the platform',
            'gpt-4o-mini',
            220,
            120,
            420,
            'SUCCESS',
            NOW() - INTERVAL '1 second',
            NOW(),
            NULL
          )
        `,
        [message.id],
      );

      await database.query(
        `
          INSERT INTO omnichannel_connectors (channel, name, is_enabled, health_status, config_snapshot)
          VALUES ('TELEGRAM', 'telegram-demo', true, 'HEALTHY', $1::jsonb)
          ON CONFLICT (channel, name) DO NOTHING
        `,
        [JSON.stringify({ seeded: true })],
      );
    });

    this.logger.info('Demo seed completed successfully');
  }
}
