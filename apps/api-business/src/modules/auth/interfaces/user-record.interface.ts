export interface UserRecord {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
