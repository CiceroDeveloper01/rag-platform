import { CardsService } from './cards.service';

describe('CardsService', () => {
  let service: CardsService;

  beforeEach(() => {
    service = new CardsService();
  });

  it('lists cards', () => {
    expect(service.listCards()).toHaveLength(2);
  });

  it('returns card limits', () => {
    expect(service.getCardLimit('card-001')).toEqual(
      expect.objectContaining({
        cardId: 'card-001',
        totalLimit: 25000,
      }),
    );
  });

  it('blocks and unblocks cards', () => {
    expect(service.blockCard('card-001', { reason: 'lost_card' }).status).toBe(
      'completed',
    );
    expect(service.getCardById('card-001').status).toBe('BLOCKED');
    expect(
      service.unblockCard('card-001', { reason: 'customer_confirmation' }).status,
    ).toBe('completed');
    expect(service.getCardById('card-001').status).toBe('ACTIVE');
  });
});
