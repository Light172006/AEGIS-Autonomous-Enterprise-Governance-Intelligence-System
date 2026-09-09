import { apiClient, withFallback } from "./apiClient";
import { mockAuthService } from "./mock/mockService";
import type { AuthResponse, User } from "@/lib/types";

export const authService = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    withFallback(
      async () => {
        const { data } = await apiClient.post<AuthResponse>("/auth/login", {
          email,
          password,
        });
        return data;
      },
      () => mockAuthService.login(email, password)
    ),

  logout: (): Promise<void> =>
    withFallback(
      async () => {
        await apiClient.post("/auth/logout");
      },
      () => mockAuthService.logout()
    ),

  getCurrentUser: (): Promise<User> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<User>("/auth/me");
        return data;
      },
      () => mockAuthService.getCurrentUser()
    ),
};
