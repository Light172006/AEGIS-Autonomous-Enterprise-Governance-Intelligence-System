"use client";

import { create } from "zustand";
import type { User } from "@/lib/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenPreloader: boolean;

  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hydrate: () => void;
  setHasSeenPreloader: (seen: boolean) => void;
  replayPreloader: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  hasSeenPreloader: false,

  login: async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem("aegis_token", response.access_token);
    localStorage.setItem("aegis_user", JSON.stringify(response.user));
    set({
      user: response.user,
      token: response.access_token,
      isAuthenticated: true,
      isLoading: false,
    });
    return response.user;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // continue logout even if API fails
    }
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setHasSeenPreloader: (seen: boolean) => {
    set({ hasSeenPreloader: seen });
  },

  replayPreloader: () => {
    set({ hasSeenPreloader: false });
  },

  hydrate: () => {
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }
    const token = localStorage.getItem("aegis_token");
    const userStr = localStorage.getItem("aegis_user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem("aegis_token");
        localStorage.removeItem("aegis_user");
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
