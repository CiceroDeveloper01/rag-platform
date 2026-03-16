export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const commonThresholds = {
  http_req_failed: ["rate<0.05"],
  http_req_duration: ["p(95)<1200"],
};

export function jsonHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    ...extra,
  };
}
