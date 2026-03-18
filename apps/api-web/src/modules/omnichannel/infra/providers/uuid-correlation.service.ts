import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ICorrelationService } from '../../application/interfaces/correlation-service.interface';

@Injectable()
export class UuidCorrelationService implements ICorrelationService {
  create(): string {
    return randomUUID();
  }
}
