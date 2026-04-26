import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";
interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}
const pageLimit = 50;
export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },
  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(`/conversations/${id}/messages`, {
      params: {
        limit: pageLimit,
        ...(cursor ? { cursor } : {}),
      },
    });
    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },
  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    imgUrl?: string,
    conversationId?: string,
    imageFile?: File,
    type?: string,
    replyToId?: string,
  ) {
    const payload = new FormData();
    payload.append("recipientId", recipientId);
    payload.append("content", content);
    if (imgUrl) payload.append("imgUrl", imgUrl);
    if (conversationId) payload.append("conversationId", conversationId);
    if (imageFile) payload.append("file", imageFile);
    if (type) payload.append("type", type);
    if (replyToId) payload.append("replyTo", replyToId);

    const res = await api.post("/messages/direct", payload, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.message;
  },
  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string,
    allowBlockedGroupMessage?: boolean,
    imageFile?: File,
    type?: string,
    replyToId?: string,
  ) {
    const payload = new FormData();
    payload.append("conversationId", conversationId);
    payload.append("content", content);
    if (imgUrl) payload.append("imgUrl", imgUrl);
    if (typeof allowBlockedGroupMessage === "boolean") {
      payload.append("allowBlockedGroupMessage", String(allowBlockedGroupMessage));
    }
    if (imageFile) payload.append("file", imageFile);
    if (type) payload.append("type", type);
    if (replyToId) payload.append("replyTo", replyToId);

    const res = await api.post("/messages/group", payload, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.message;
  },
  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },
  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[],
  ) {
    const res = await api.post(
      "/conversations",
      { type, name, memberIds },
      { withCredentials: true },
    );
    return res.data.conversation;
  },
};
