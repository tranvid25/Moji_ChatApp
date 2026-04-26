import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStores";
import { useSocketStore } from "./useSocketStore";
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false,
      messageLoading: false,
      loading: false,
      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () =>
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        }),
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();
          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error(error);
          set({ convoLoading: false });
        } finally {
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();
        const convoId = conversationId ?? activeConversationId;
        if (!convoId) return;
        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;
        if (nextCursor === null) return;
        set({ messageLoading: true });
        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor,
          );
          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));
          set((state) => {
            const prev = state.messages[convoId]?.items || [];
            const merged =
              prev.length > 0 ? [...processed, ...prev] : processed;
            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  nextCursor: cursor ?? null,
                  hasMore: !!cursor,
                },
              },
            };
          });
        } catch (error) {
          console.error(error);
          set({ messageLoading: false });
        } finally {
          set({ messageLoading: false });
        }
      },
      sendDirectMessage: async (recipientId, content, imgUrl, imageFile, type) => {
        const { activeConversationId } = get();
        const { user } = useAuthStore.getState();
        if (!user) return;

        const tempId = `temp-${Date.now()}`;
        const fileIsImage = imageFile?.type?.startsWith("image/");
        const optimisticMessage: Message = {
          _id: tempId,
          conversationId: activeConversationId || "temp-convo",
          senderId: user._id,
          content: content || null,
          imgUrl: imageFile && fileIsImage ? URL.createObjectURL(imageFile) : imgUrl || null,
          fileUrl: imageFile && !fileIsImage ? "" : null,
          fileName: imageFile && !fileIsImage ? imageFile.name : null,
          type: type ? (type as any) : (imageFile && !fileIsImage ? (imageFile.type.startsWith("audio/") ? "audio" : "file") : (imageFile ? "image" : "text")),
          createdAt: new Date().toISOString(),
          isOwn: true,
          isSending: true,
        };

        const convoId = activeConversationId;
        if (convoId) {
          set((state) => {
            const currentConvoMessages = state.messages[convoId] || {
              items: [],
              hasMore: false,
            };
            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  ...currentConvoMessages,
                  items: [...currentConvoMessages.items, optimisticMessage],
                },
              },
            };
          });
        }

        try {
          const message = await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined,
            imageFile,
            type
          );

          set((state) => {
            const finalConvoId = message.conversationId;
            const currentConvoMessages = state.messages[finalConvoId] || {
              items: [],
              hasMore: false,
            };

            // If we were in a temp convo (new chat), we might need to update the key
            const newMessages = { ...state.messages };
            if (convoId && convoId !== finalConvoId) {
              delete newMessages[convoId];
            }

            return {
              messages: {
                ...newMessages,
                [finalConvoId]: {
                  ...currentConvoMessages,
                  items: currentConvoMessages.items.map((m) =>
                    m._id === tempId ? { ...message, isOwn: true } : m,
                  ),
                },
              },
              conversations: state.conversations.map((c) =>
                c._id === finalConvoId ? { ...c, seenBy: [] } : c,
              ),
            };
          });
        } catch (error) {
          if (convoId) {
            set((state) => ({
              messages: {
                ...state.messages,
                [convoId]: {
                  ...state.messages[convoId],
                  items: state.messages[convoId].items.filter(
                    (m) => m._id !== tempId,
                  ),
                },
              },
            }));
          }
          console.error("Lỗi xảy ra khi gửi tin nhắn", error);
          throw error;
        }
      },
      sendGroupMessage: async (
        conversationId,
        content,
        imgUrl,
        allowBlockedGroupMessage,
        imageFile,
        type
      ) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        const tempId = `temp-${Date.now()}`;
        const fileIsImage = imageFile?.type?.startsWith("image/");
        const optimisticMessage: Message = {
          _id: tempId,
          conversationId: conversationId,
          senderId: user._id,
          content: content || null,
          imgUrl: imageFile && fileIsImage ? URL.createObjectURL(imageFile) : imgUrl || null,
          fileUrl: imageFile && !fileIsImage ? "" : null,
          fileName: imageFile && !fileIsImage ? imageFile.name : null,
          type: type ? (type as any) : (imageFile && !fileIsImage ? (imageFile.type.startsWith("audio/") ? "audio" : "file") : (imageFile ? "image" : "text")),
          createdAt: new Date().toISOString(),
          isOwn: true,
          isSending: true,
        };

        set((state) => {
          const currentConvoMessages = state.messages[conversationId] || {
            items: [],
            hasMore: false,
          };
          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...currentConvoMessages,
                items: [...currentConvoMessages.items, optimisticMessage],
              },
            },
          };
        });

        try {
          const message = await chatService.sendGroupMessage(
            conversationId,
            content,
            imgUrl,
            allowBlockedGroupMessage,
            imageFile,
            type,
          );

          set((state) => {
            const currentConvoMessages = state.messages[conversationId] || {
              items: [],
              hasMore: false,
            };
            return {
              messages: {
                ...state.messages,
                [conversationId]: {
                  ...currentConvoMessages,
                  items: currentConvoMessages.items.map((m) =>
                    m._id === tempId ? { ...message, isOwn: true } : m,
                  ),
                },
              },
              conversations: state.conversations.map((c) =>
                c._id === get().activeConversationId ? { ...c, seenBy: [] } : c,
              ),
            };
          });
        } catch (error) {
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: state.messages[conversationId].items.filter(
                  (m) => m._id !== tempId,
                ),
              },
            },
          }));
          console.error("Lỗi xảy ra khi gửi tin nhắn group", error);
          throw error;
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();
          message.isOwn = message.senderId === user?._id;
          const convoId = message.conversationId;
          let prevItems = get().messages[convoId]?.items ?? [];
          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }
          set((state) => {
            const currentConvo = state.messages[convoId];
            const currentItems = currentConvo?.items ?? [];

            if (currentItems.some((m) => m._id === message._id)) return state;

            // Optimistic deduplication:
            // Find a message that is currently sending, has same sender, and same content
            const optimisticIndex = currentItems.findIndex(
              (m) =>
                m.isSending &&
                m.senderId === message.senderId &&
                m.content === message.content &&
                m.type === message.type
            );

            if (optimisticIndex !== -1) {
              const newItems = [...currentItems];
              newItems[optimisticIndex] = message;
              return {
                messages: {
                  ...state.messages,
                  [convoId]: {
                    ...currentConvo,
                    items: newItems,
                  },
                },
              };
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  ...currentConvo,
                  items: [...currentItems, message],
                  hasMore: currentConvo?.hasMore ?? false,
                  nextCursor: currentConvo?.nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi thêm tin nhắn", error);
        }
      },
      updateConversation: (conversation) => {
        set((state) => {
          return {
            conversations: state.conversations.map((c) =>
              c._id === conversation._id ? { ...c, ...conversation } : c,
            ),
          };
        });
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();
          if (!activeConversationId || !user) {
            return;
          }
          const convo = conversations.find(
            (c) => c._id === activeConversationId,
          );
          if (!convo) {
            return;
          }
          if ((convo.unreadCount?.[user._id] ?? 0) === 0) {
            return;
          }
          await chatService.markAsSeen(activeConversationId);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? { ...c, unreadCount: { ...c.unreadCount, [user._id]: 0 } }
                : c,
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi đánh dấu là đã đọc", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString(),
          );
          return {
            conversations: exists
              ? state.conversations
              : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds,
          );
          get().addConvo(conversation);
          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi tạo cuộc trò chuyện", error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
