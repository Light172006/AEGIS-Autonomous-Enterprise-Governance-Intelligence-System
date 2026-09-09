import { apiClient, withFallback } from "./apiClient";
import { mockUserService } from "./mock/mockService";
import type { User } from "@/lib/types";

export const userService = {
  list: (): Promise<User[]> =>
    withFallback(
      async () => {
        const { data } = await apiClient.get<User[]>("/users");
        return data;
      },
      () => mockUserService.list()
    ),

  create: (userData: {
    name: string;
    email: string;
    role: "admin" | "user" | "viewer";
    department: string;
  }): Promise<User> =>
    withFallback(
      async () => {
        const { data } = await apiClient.post<User>("/users", userData);
        return data;
      },
      () => mockUserService.create(userData)
    ),

  updateRole: (id: string, role: "admin" | "user" | "viewer"): Promise<User> =>
    withFallback(
      async () => {
        const { data } = await apiClient.patch<User>(`/users/${id}/role`, { role });
        return data;
      },
      () => mockUserService.updateRole(id, role)
    ),

  updateStatus: (id: string, status: "active" | "suspended"): Promise<User> =>
    withFallback(
      async () => {
        const { data } = await apiClient.patch<User>(`/users/${id}/status`, { status });
        return data;
      },
      () => mockUserService.updateStatus(id, status)
    ),

  toggleStatus: (id: string): Promise<User> =>
    withFallback(
      async () => {
        const { data } = await apiClient.post<User>(`/users/${id}/toggle-status`);
        return data;
      },
      () => mockUserService.toggleStatus(id)
    ),

  delete: (id: string): Promise<void> =>
    withFallback(
      async () => {
        await apiClient.delete(`/users/${id}`);
      },
      () => mockUserService.delete(id)
    ),
};
