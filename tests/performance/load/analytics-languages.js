import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, commonThresholds } from "../lib/config.js";

export const options = {
  scenarios: {
    steady_analytics_read: {
      executor: "constant-vus",
      vus: 10,
      duration: "2m",
    },
  },
  thresholds: {
    ...commonThresholds,
    http_req_duration: ["p(95)<1500"],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/v1/analytics/languages`);

  check(response, {
    "analytics responds 200": (res) => res.status === 200,
    "languages payload exists": (res) => Array.isArray(res.json("languages")),
  });

  sleep(1);
}
