export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
}
export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}
export interface Group {
  name: string;
  createdBy: string;
}
export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}
export interface Conversation {
  _id: string;
  type: "direct" | "group";
  participants: Participant[];
  group?: Group;
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCount: Record<string, number>;
  mutedBy?: string[];
  createdAt: string;
  updatedAt: string;
}
export interface ConversationResponse {
  conversations: Conversation[];
}
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  type?: "text" | "image" | "video" | "file" | "audio" | "location" | "meeting";
  replyTo?: Message | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  isSending?: boolean;
}
