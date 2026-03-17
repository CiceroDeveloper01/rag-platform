export interface IClockService {
  now(): Date;
}

export const OMNICHANNEL_CLOCK_SERVICE = Symbol('OMNICHANNEL_CLOCK_SERVICE');
