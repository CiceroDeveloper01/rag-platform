import { CreditService } from './credit.service';

describe('CreditService', () => {
  let service: CreditService;

  beforeEach(() => {
    service = new CreditService();
  });

  it('simulates credit', () => {
    expect(
      service.simulateCredit({
        requestedAmount: 10000,
        installmentCount: 24,
      }).monthlyInstallment,
    ).toBeGreaterThan(0);
  });

  it('returns credit contracts', () => {
    expect(service.getContracts()).toHaveLength(1);
  });

  it('returns credit limit', () => {
    expect(service.getLimit()).toEqual(
      expect.objectContaining({
        preApproved: true,
      }),
    );
  });
});
