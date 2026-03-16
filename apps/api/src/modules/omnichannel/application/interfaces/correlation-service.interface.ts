export interface ICorrelationService {
  create(): string;
}

export const OMNICHANNEL_CORRELATION_SERVICE = Symbol(
  'OMNICHANNEL_CORRELATION_SERVICE',
);
