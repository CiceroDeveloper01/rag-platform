import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { signHs256Jwt } from "../utils/jwt.util";

@Injectable()
export class InternalServiceTokenService {
  constructor(private readonly configService: ConfigService) {}

  issueToken(scopes?: string[]) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const defaultScopes =
      this.configService.get<string[]>(
        "security.internalService.defaultScopes",
        [],
      ) ?? [];
    const ttlSeconds =
      this.configService.get<number>(
        "security.internalService.ttlSeconds",
        300,
      ) ?? 300;

    return signHs256Jwt(
      {
        type: "service",
        iss: this.configService.getOrThrow<string>(
          "security.internalService.issuer",
        ),
        aud: this.configService.getOrThrow<string>(
          "security.internalService.audience",
        ),
        sub: this.configService.getOrThrow<string>(
          "security.internalService.subject",
        ),
        scope: (scopes && scopes.length > 0 ? scopes : defaultScopes).join(" "),
        iat: nowInSeconds,
        exp: nowInSeconds + ttlSeconds,
      },
      this.configService.getOrThrow<string>("security.internalService.secret"),
    );
  }
}
