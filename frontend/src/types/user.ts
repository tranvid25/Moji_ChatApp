export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  preferences?: {
    notifications?: {
      friendRequest?: boolean;
      directMessage?: boolean;
      groupMessage?: boolean;
    };
    privacy?: {
      showOnlineStatus?: boolean;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockCandidate {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isBlocked?: boolean;
}
export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  _id: string;
  from?: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  to: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  message:string;
  createdAt:string;
  updatedAt:string;
}
