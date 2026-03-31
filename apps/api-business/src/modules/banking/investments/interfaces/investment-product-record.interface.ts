export interface InvestmentProductRecord {
  id: string;
  name: string;
  type: string;
  minimumAmount: number;
  annualRate: number;
  liquidity: string;
  maturityDays: number;
}
