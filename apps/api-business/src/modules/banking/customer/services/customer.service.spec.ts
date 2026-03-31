import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    service = new CustomerService();
  });

  it('returns a customer profile', () => {
    expect(service.getProfile()).toEqual(
      expect.objectContaining({
        id: 'cust-001',
        fullName: 'Ada Lovelace',
      }),
    );
  });

  it('returns a customer summary', () => {
    expect(service.getSummary()).toEqual(
      expect.objectContaining({
        hasCreditCard: true,
        hasInvestments: true,
      }),
    );
  });
});
