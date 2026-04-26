import { userService } from "@/services/userService";
import type { BlockCandidate } from "@/types/user";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStores";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";
import { useSocketStore } from "./useSocketStore";

export const useUserStore = create<UserState>(() => ({
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const res = await userService.uploadAvatar(formData);
      if (user && res.data?.avatarUrl) {
        setUser({ ...user, avatarUrl: res.data.avatarUrl });
        useChatStore.getState().fetchConversations();
        toast.success(res.message || "Cập nhật ảnh đại diện thành công");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật ảnh đại diện", error);
      toast.error("Cập nhật ảnh đại diện thất bại");
    }
  },

  updateOnlineStatus: async (showOnlineStatus) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.updateOnlineStatus(showOnlineStatus);
      if (user) {
        setUser({
          ...user,
          preferences: {
            ...user.preferences,
            privacy: {
              ...user.preferences?.privacy,
              showOnlineStatus,
            },
            notifications: {
              ...user.preferences?.notifications,
            },
          },
        });
      }
      useSocketStore.getState().socket?.emit("privacy-online-status-updated");
      toast.success(data?.message || "Cập nhật trạng thái online thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái online", error);
      toast.error("Cập nhật trạng thái online thất bại");
      throw error;
    }
  },

  updateNotifications: async (payload) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.updateNotifications(payload);
      if (user) {
        setUser({
          ...user,
          preferences: {
            ...user.preferences,
            privacy: {
              ...user.preferences?.privacy,
            },
            notifications: {
              ...user.preferences?.notifications,
              ...payload,
            },
          },
        });
      }
      toast.success(data?.message || "Đã lưu cài đặt thông báo");
    } catch (error) {
      console.error("Lỗi khi cập nhật thông báo", error);
      toast.error("Không thể cập nhật cài đặt thông báo");
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const data = await userService.changePassword(currentPassword, newPassword);
      toast.success(data?.message || "Đổi mật khẩu thành công");
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Đổi mật khẩu thất bại"
          : "Đổi mật khẩu thất bại";
      toast.error(message);
      throw error;
    }
  },

  getBlockCandidates: async (): Promise<BlockCandidate[]> => {
    const list = await userService.getBlockCandidates();
    return list;
  },

  blockUser: async (blockedUserId) => {
    await userService.blockUser(blockedUserId);
    toast.success("Đã chặn người dùng");
  },

  unblockUser: async (blockedUserId) => {
    await userService.unblockUser(blockedUserId);
    toast.success("Đã bỏ chặn người dùng");
  },

  getBlockedUsers: async (): Promise<BlockCandidate[]> => {
    const users = await userService.getBlockedUsers();
    return users;
  },

  reportUser: async (payload) => {
    await userService.reportUser(payload);
    toast.success("Báo cáo đã được gửi");
  },

  leaveGroupConversation: async (conversationId) => {
    await userService.leaveGroupConversation(conversationId);
    const { conversations, setActiveConversation } = useChatStore.getState();
    const nextConversations = conversations.filter((c) => c._id !== conversationId);
    useChatStore.setState({
      conversations: nextConversations,
      activeConversationId: null,
    });
    setActiveConversation(null);
    toast.success("Bạn đã rời nhóm");
  },

  renameGroupConversation: async (conversationId, name) => {
    const res = await userService.renameGroupConversation(conversationId, name);
    useChatStore.setState((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? {
              ...c,
              group: {
                ...c.group,
                name,
              },
            }
          : c,
      ),
    }));
    toast.success(res?.message || "Đổi tên nhóm thành công");
  },

  muteGroupConversation: async (conversationId, muted) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    const userId = user._id;
    const res = await userService.muteGroupConversation(conversationId, muted);

    useChatStore.setState((state) => ({
      conversations: state.conversations.map((c) => {
        if (c._id !== conversationId) return c;
        const mutedBy = new Set(c.mutedBy || []);
        if (muted) mutedBy.add(userId);
        else mutedBy.delete(userId);
        return {
          ...c,
          mutedBy: Array.from(mutedBy),
        };
      }),
    }));

    toast.success(res?.message || (muted ? "Đã tắt thông báo nhóm" : "Đã bật thông báo nhóm"));
  },
}));
