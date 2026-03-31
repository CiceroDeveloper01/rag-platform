export interface CardRecord {
  id: string;
  brand: string;
  last4: string;
  status: 'ACTIVE' | 'BLOCKED';
  holderName: string;
  totalLimit: number;
  availableLimit: number;
  usedLimit: number;
  invoiceDueDate: string;
  invoiceAmount: number;
  minimumPayment: number;
}
