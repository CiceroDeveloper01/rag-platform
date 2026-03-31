import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
import { CardsController } from './cards.controller';
import { CardsService } from '../services/cards.service';

describe('CardsController', () => {
  it('delegates list and block actions to the service', () => {
    const cardsService = {
      listCards: jest.fn().mockReturnValue([{ id: 'card-001' }]),
      blockCard: jest.fn().mockReturnValue({ status: 'completed' }),
    } as unknown as CardsService;
    const tenantContextService: Pick<TenantContextService, 'resolveTenant'> = {
      resolveTenant: jest.fn().mockReturnValue('tenant-a'),
    };
    const controller = new CardsController(cardsService, tenantContextService);

    expect(controller.listCards('tenant-a')).toEqual([{ id: 'card-001' }]);
    expect(
      controller.blockCard('card-001', { reason: 'lost_card' }, 'tenant-a'),
    ).toEqual({ status: 'completed' });
  });
});
