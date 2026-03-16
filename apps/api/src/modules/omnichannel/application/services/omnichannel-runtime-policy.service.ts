import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OmnichannelRuntimePolicyService {
  constructor(private readonly configService: ConfigService) {}

  isApiRuntimeEnabled(): boolean {
    return (
      this.configService.get<boolean>('omnichannel.apiRuntimeEnabled', false) ??
      false
    );
  }

  assertApiRuntimeEnabled(entrypoint: string): void {
    if (this.isApiRuntimeEnabled()) {
      return;
    }

    throw new ServiceUnavailableException(
      `Omnichannel runtime is disabled in the API for ${entrypoint}. Use the orchestrator runtime instead.`,
    );
  }
}
