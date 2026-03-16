import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, commonThresholds, jsonHeaders } from "../lib/config.js";

export const options = {
  scenarios: {
    internal_documents_stress: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 40 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...commonThresholds,
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const response = http.post(
    `${BASE_URL}/api/v1/internal/documents/register`,
    JSON.stringify({
      source: "k6",
      content: "Synthetic performance document payload for registration.",
      externalMessageId: `perf-${__VU}-${__ITER}`,
      metadata: {
        suite: "stress",
      },
    }),
    {
      headers: jsonHeaders(),
    },
  );

  check(response, {
    "documents register responds 201 or 200": (res) =>
      res.status === 200 || res.status === 201,
    "documents register returns success": (res) => res.json("success") === true,
  });

  sleep(1);
}
