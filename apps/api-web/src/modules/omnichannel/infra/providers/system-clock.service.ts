import { Injectable } from '@nestjs/common';
import { IClockService } from '../../application/interfaces/clock-service.interface';

@Injectable()
export class SystemClockService implements IClockService {
  now(): Date {
    return new Date();
  }
}
