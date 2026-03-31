import { Injectable } from "@nestjs/common";

@Injectable()
export class BlockCardToolService {
  execute(payload: { reason: string }) {
    return {
      status: "blocked",
      protocol: "BLK-2026-0001",
      reason: payload.reason,
    };
  }
}
