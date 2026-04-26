import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStores";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useVideoCallStore } from "./useVideoCallStore";
import { useGroupCallStore } from "./useGroupCallStore";

const baseUrl = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;
    if (existingSocket) return;
    const socket: Socket = io(baseUrl, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket"],
      withCredentials: true,
    });
    set({ socket });

    socket.on("connect", () => {
      console.log("socket connected");
    });

    socket.on("onlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("new-message", ({ message, conversation, unreadCount }) => {
      useChatStore.getState().addMessage(message);
      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        senderId: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };
      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCount,
      };
      if (
        useChatStore.getState().activeConversationId === message.conversationId
      ) {
        useChatStore.getState().markAsSeen();
      }
      useChatStore.getState().updateConversation(updatedConversation);
    });

    // READ MESSAGE
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount: conversation.unreadCount,
        seenBy: conversation.seenBy,
      };
      useChatStore.getState().updateConversation(updated);
    });

    // NEW GROUP CHAT
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // ─── WebRTC Signaling Events ──────────────────────────────────────────

    /**
     * Fired on the CALLEE side when someone calls them.
     * Payload: { from, fromName, fromAvatar, conversationId, offer }
     */
    socket.on(
      "incoming-call",
      ({
        from,
        fromName,
        fromAvatar,
        conversationId,
        offer,
      }: {
        from: string;
        fromName: string;
        fromAvatar?: string;
        conversationId: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        const callStore = useVideoCallStore.getState();

        // Ignore if already in a call
        if (callStore.status !== "idle") return;

        // Stash the offer on window so VideoCall component can access it
        // (avoids making store aware of RTCSessionDescriptionInit)
        (window as unknown as Record<string, unknown>).__pendingOffer = offer;

        callStore.receiveCall({
          conversationId,
          remoteUserId: from,
          remoteUserName: fromName,
          remoteUserAvatar: fromAvatar,
        });
      },
    );

    /**
     * Fired on the CALLER side when the callee answers.
     * Payload: { from, answer }
     */
    socket.on(
      "call-answered",
      async ({
        answer,
      }: {
        from: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        const pc = useVideoCallStore.getState().peerConnection;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      },
    );

    /**
     * Fired on both sides for ICE negotiation.
     * Payload: { from, candidate }
     */
    socket.on(
      "ice-candidate",
      async ({ candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
        const pc = useVideoCallStore.getState().peerConnection;
        if (!pc) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("[Socket] Error adding ICE candidate:", err);
        }
      },
    );

    /**
     * Fired on both sides when the other party ends/rejects the call.
     */
    socket.on("call-ended", () => {
      const callStore = useVideoCallStore.getState();
      if (callStore.status !== "idle") {
        callStore.endCall();
      }
    });

    // ─── Group Call Signaling Events ──────────────────────────────────────────

    /**
     * Fired when someone starts a group call in an active conversation.
     */
    socket.on(
      "incoming-group-call",
      async ({
        conversationId,
        groupName,
        callerName,
        callerAvatar,
        callerId,
      }: {
        conversationId: string;
        groupName: string;
        callerName: string;
        callerAvatar?: string;
        callerId: string;
      }) => {
        const groupCallStore = useGroupCallStore.getState();
        const videoCallStore = useVideoCallStore.getState();

        // Ignore if already in any kind of call
        if (groupCallStore.status !== "idle" || videoCallStore.status !== "idle") return;

        groupCallStore.receiveCall({
          conversationId,
          groupName,
          callerName,
          callerAvatar,
          callerId,
        });
      }
    );

    // ─── Appointments ──────────────────────────────────────────
    socket.on("appointmentReminder", ({ title, startTime }) => {
      import("sonner").then(({ toast }) => {
        toast.info(`Nhắc nhở: Lịch hẹn sắp diễn ra`, {
          description: `Lịch hẹn "${title}" bắt đầu lúc ${new Date(startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`,
          duration: 10000,
        });
      });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
