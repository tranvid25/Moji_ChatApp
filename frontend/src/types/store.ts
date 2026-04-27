import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { BlockCandidate, Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  clearState: () => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  signUp: (
    lastname: string,
    firstname: string,
    username: string,
    email: string,
    password: string,
  ) => Promise<any>;

  signIn: (username: string, password: string) => Promise<any>;

  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}
export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean;
      nextCursor?: string | null;
    }
  >;
  activeConversationId: string | null;
  convoLoading: boolean;
  messageLoading: boolean;
  loading:boolean;
  replyingToMessage: Message | null;
  reset: () => void;

  setActiveConversation: (id: string | null) => void;
  setReplyingToMessage: (message: Message | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (ConversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
    imageFile?: File,
    type?: string,
    replyToId?: string,
    metadata?: { toolName?: string; link?: string },
    isImportant?: boolean
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
    allowBlockedGroupMessage?: boolean,
    imageFile?: File,
    type?: string,
    replyToId?: string,
    metadata?: { toolName?: string; link?: string },
    isImportant?: boolean
  ) => Promise<void>;
  //add message
  addMessage: (message: Message) => Promise<void>;

  //update convo
  updateConversation: (conversation: unknown) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[],
  ) => Promise<void>;
}
export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}
export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequest: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
}
export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
  updateOnlineStatus: (showOnlineStatus: boolean) => Promise<void>;
  updateNotifications: (payload: {
    friendRequest?: boolean;
    directMessage?: boolean;
    groupMessage?: boolean;
  }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  getBlockCandidates: () => Promise<BlockCandidate[]>;
  blockUser: (blockedUserId: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  getBlockedUsers: () => Promise<BlockCandidate[]>;
  reportUser: (payload: {
    targetUserId: string;
    reason: string;
    conversationId?: string;
  }) => Promise<void>;
  leaveGroupConversation: (conversationId: string) => Promise<void>;
  renameGroupConversation: (conversationId: string, name: string) => Promise<void>;
  muteGroupConversation: (conversationId: string, muted: boolean) => Promise<void>;
}
