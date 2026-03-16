import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, commonThresholds } from "../lib/config.js";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: commonThresholds,
};

export default function () {
  const response = http.get(`${BASE_URL}/api/v1/health`);

  check(response, {
    "health responds 200": (res) => res.status === 200,
    "health includes status": (res) => res.json("status") !== undefined,
  });

  sleep(1);
}
