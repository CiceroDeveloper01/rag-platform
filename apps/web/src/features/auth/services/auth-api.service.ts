import { apiRequest } from "@/src/lib/api/api-client";
import type { LoginPayload, Session } from "../types/auth.types";

export const authApiService = {
  async login(payload: LoginPayload): Promise<Session> {
    return apiRequest<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getMe(): Promise<Session> {
    const response = await apiRequest<{ user: Session["user"] }>("/auth/me");

    return {
      user: response.user,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    };
  },

  async logout(): Promise<void> {
    await apiRequest<{ success: boolean }>("/auth/logout", {
      method: "POST",
    });
  },
};
