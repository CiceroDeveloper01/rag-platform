import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, commonThresholds, jsonHeaders } from "../lib/config.js";

export const options = {
  scenarios: {
    average_chat_load: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 10 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    ...commonThresholds,
    http_req_duration: ["p(95)<2500"],
  },
};

export default function () {
  const response = http.post(
    `${BASE_URL}/api/v1/chat`,
    JSON.stringify({
      question: "Where is my invoice?",
      topK: 5,
      stream: false,
    }),
    {
      headers: jsonHeaders({
        Cookie: __ENV.CHAT_SESSION_COOKIE || "",
      }),
    },
  );

  check(response, {
    "chat responds 200": (res) => res.status === 200,
    "chat returns answer": (res) =>
      typeof res.json("answer") === "string" || res.status === 401,
  });

  sleep(1);
}
