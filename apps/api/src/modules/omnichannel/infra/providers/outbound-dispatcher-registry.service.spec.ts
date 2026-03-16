import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OutboundDispatcherRegistryService } from './outbound-dispatcher-registry.service';

describe('OutboundDispatcherRegistryService', () => {
  it('routes dispatch to the matching channel dispatcher', async () => {
    const telegramDispatcher = {
      supports: jest.fn(
        (channel: MessageChannel) => channel === MessageChannel.TELEGRAM,
      ),
      dispatch: jest.fn().mockResolvedValue({ accepted: true }),
    };
    const noopDispatcher = {
      supports: jest.fn().mockReturnValue(true),
      dispatch: jest.fn().mockResolvedValue({ accepted: false }),
    };

    const registry = new OutboundDispatcherRegistryService(
      telegramDispatcher as never,
      {
        supports: jest.fn().mockReturnValue(false),
        dispatch: jest.fn(),
      } as never,
      {
        supports: jest.fn().mockReturnValue(false),
        dispatch: jest.fn(),
      } as never,
      noopDispatcher as never,
    );

    await expect(
      registry.dispatch({
        channel: MessageChannel.TELEGRAM,
        correlationId: 'corr-1',
        message: { id: 1 } as never,
      }),
    ).resolves.toEqual({ accepted: true });
    expect(telegramDispatcher.dispatch).toHaveBeenCalled();
  });
});
