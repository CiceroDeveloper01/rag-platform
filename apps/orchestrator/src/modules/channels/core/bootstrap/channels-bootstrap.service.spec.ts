import { ChannelsBootstrapService } from "./channels-bootstrap.service";

describe("ChannelsBootstrapService", () => {
  it("starts every registered listener", async () => {
    const logger = {
      log: jest.fn(),
    } as any;
    const channelListeners = [
      { channel: "EMAIL", start: jest.fn().mockResolvedValue(undefined) },
      { channel: "TELEGRAM", start: jest.fn().mockResolvedValue(undefined) },
    ] as any;

    const service = new ChannelsBootstrapService(logger, channelListeners);

    await service.onApplicationBootstrap();

    expect(channelListeners[0].start).toHaveBeenCalledTimes(1);
    expect(channelListeners[1].start).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalled();
  });
});
