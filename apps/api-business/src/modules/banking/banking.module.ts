import { Module } from '@nestjs/common';
import { CardsModule } from './cards/cards.module';
import { CreditModule } from './credit/credit.module';
import { CustomerModule } from './customer/customer.module';
import { InvestmentsModule } from './investments/investments.module';

@Module({
  imports: [CardsModule, InvestmentsModule, CustomerModule, CreditModule],
  exports: [CardsModule, InvestmentsModule, CustomerModule, CreditModule],
})
export class BankingModule {}
