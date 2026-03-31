import { Injectable } from '@nestjs/common';
import { CustomerProfileResponse } from '../dtos/response/customer-profile.response';
import { CustomerSummaryResponse } from '../dtos/response/customer-summary.response';
import { CustomerProfileRecord } from '../interfaces/customer-profile-record.interface';

@Injectable()
export class CustomerService {
  private readonly profile: CustomerProfileRecord = {
    id: 'cust-001',
    fullName: 'Ada Lovelace',
    email: 'ada@rag-bank.test',
    segment: 'Prime',
    relationshipStatus: 'active',
  };

  getProfile(): CustomerProfileResponse {
    return { ...this.profile };
  }

  getSummary(): CustomerSummaryResponse {
    return {
      id: this.profile.id,
      fullName: this.profile.fullName,
      activeProducts: 4,
      totalAccounts: 2,
      hasCreditCard: true,
      hasInvestments: true,
    };
  }
}
