import { create } from "zustand";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { toast } from "sonner";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";
import { useSocketStore } from "./useSocketStore";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      clearState: () => {
        set({ loading: false, accessToken: null, user: null });
        localStorage.removeItem("auth-storage");
        useChatStore.getState().reset();
        useSocketStore.getState().disconnectSocket();
      },
      signUp: async (lastname, firstname, username, email, password) => {
        try {
          set({ loading: true });

          const res = await authService.signUp(
            lastname,
            firstname,
            username,
            email,
            password,
          );

          return res;
        } catch (error) {
          console.error(error);
          toast.error("Đăng ký thất bại");
        } finally {
          set({ loading: false });
        }
      },

      signIn: async (username, password) => {
        try {
          set({ loading: true });
          localStorage.clear();
          useChatStore.getState().reset();
          const res = await authService.signIn(username, password);

          get().setAccessToken(res.accessToken);
          await get().fetchMe();
          await useChatStore.getState().fetchConversations();
          return res;
        } catch (error: any) {
          console.error(error);

          const message =
            error?.response?.data?.message || "Đăng nhập thất bại";

          toast.error(message);

          throw error;
        } finally {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Đăng xuất thành công");
        } catch (error) {
          console.error(error);
          toast.error("Đăng xuất thất bại");
        }
      },
      fetchMe: async () => {
        try {
          const res = await authService.fetchMe();
          set({ user: res });
        } catch (error: any) {
          console.error(error);
          const message =
            error?.response?.data?.message ||
            "Lấy thông tin người dùng thất bại";
          set({ user: null, accessToken: null });
          toast.error(message);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      refresh: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();
          setAccessToken(accessToken);
          if (!user) {
            await fetchMe();
          }
        } catch (error: any) {
          console.error(error);
          toast.error("Phiên đăng nhập đã hết hạn vui lòng đăng nhập lại");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user,
    },
  ),
);
