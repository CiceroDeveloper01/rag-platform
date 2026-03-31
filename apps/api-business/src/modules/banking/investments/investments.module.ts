import { Module } from '@nestjs/common';
import { TenantContextService } from '../../../common/tenancy/tenant-context.service';
import { InvestmentsController } from './controllers/investments.controller';
import { InvestmentsService } from './services/investments.service';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, TenantContextService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
