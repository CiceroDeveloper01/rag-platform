import { Module } from '@nestjs/common';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { CreditController } from './controllers/credit.controller';
import { CreditService } from './services/credit.service';

@Module({
  controllers: [CreditController],
  providers: [CreditService, TenantContextService],
  exports: [CreditService],
})
export class CreditModule {}
