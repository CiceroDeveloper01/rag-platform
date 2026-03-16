import { BaseRequest } from "../interfaces/base-request.interface";

export interface HandoffRequest extends BaseRequest {
  reason: string;
}
