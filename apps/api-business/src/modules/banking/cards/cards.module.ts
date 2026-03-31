import { Module } from '@nestjs/common';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { CardsController } from './controllers/cards.controller';
import { CardsService } from './services/cards.service';

@Module({
  controllers: [CardsController],
  providers: [CardsService, TenantContextService],
  exports: [CardsService],
})
export class CardsModule {}
