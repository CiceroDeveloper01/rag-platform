import { OmnichannelController } from './omnichannel.controller';

describe('OmnichannelController', () => {
  it('delegates the dev runtime endpoint to the API orchestrator service', async () => {
    const orchestratorService = {
      process: jest.fn().mockResolvedValue({ accepted: true }),
    };
    const controller = new OmnichannelController(orchestratorService as never);

    await expect(
      controller.process({
        channel: 'TELEGRAM' as never,
        body: 'hello',
      }),
    ).resolves.toEqual({ accepted: true });
    expect(orchestratorService.process).toHaveBeenCalledWith({
      channel: 'TELEGRAM',
      body: 'hello',
    });
  });
});
