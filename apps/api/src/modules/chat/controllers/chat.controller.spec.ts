import type { Request, Response } from 'express';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { ChatController } from './chat.controller';

describe('ChatController', () => {
  it('resolves tenant context before delegating to the chat service', async () => {
    const chatService = {
      chat: jest.fn().mockResolvedValue({ answer: 'ok' }),
    };
    const tenantContextService = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    } as unknown as TenantContextService;
    const controller = new ChatController(
      chatService as never,
      tenantContextService,
    );
    const response = {
      json: jest.fn(),
    } as unknown as Response;

    await controller.chat(
      {
        question: 'Where is my invoice?',
      },
      {
        id: 10,
        email: 'user@example.com',
        fullName: 'User Example',
        role: 'user',
      },
      {
        headers: {},
      } as Request,
      response,
      'tenant-a',
    );

    expect(tenantContextService.resolveTenant).toHaveBeenCalledWith({
      headerTenantId: 'tenant-a',
      explicitTenantId: undefined,
    });
    expect(chatService.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Where is my invoice?',
        tenantId: 'tenant-a',
      }),
      expect.objectContaining({
        id: 10,
      }),
    );
    expect(response.json).toHaveBeenCalledWith({ answer: 'ok' });
  });
});
