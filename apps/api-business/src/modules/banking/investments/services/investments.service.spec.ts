import { InvestmentsService } from './investments.service';

describe('InvestmentsService', () => {
  let service: InvestmentsService;

  beforeEach(() => {
    service = new InvestmentsService();
  });

  it('lists products', () => {
    expect(service.listProducts()).toHaveLength(2);
  });

  it('simulates investments', () => {
    expect(
      service.simulateInvestment({
        productType: 'cdb',
        amount: 5000,
        periodInDays: 365,
      }).projectedAmount,
    ).toBeGreaterThan(5000);
  });

  it('creates investment orders', () => {
    expect(
      service.createOrder({ productId: 'prod-cdb-001', amount: 5000 }).status,
    ).toBe('accepted');
  });
});
