import React from "react";
import type { Conversation } from "@/types/chat";
import ChatCart from "./ChatCart";
import { useAuthStore } from "@/stores/useAuthStores";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";

const DirectMessageCart = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages,fetchMessages } =
    useChatStore();
    const {onlineUsers}=useSocketStore();
  if (!user) return null;
  const otherUser = convo.participants.find((p) => p._id !== user._id);
  if (!otherUser) return null;
  const unreadCount = convo.unreadCount[user._id];
  const lastMessage = convo.lastMessage?.content ?? "";
  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages(id);
    }
  };
  return (
    <ChatCart
      convoId={convo._id}
      name={otherUser.displayName ?? ""}
      timeStamp={
        convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : undefined
      }
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      leftSection={
        <>
          {/* todo:user avatar */}
          <UserAvatar
            type="sidebar"
            name={otherUser.displayName ?? ""}
            avatarUrl={otherUser.avatarUrl}
          />
          <StatusBadge status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
        </>
      }
      subtitle={
        <p
          className={cn(
            "text-sm truncate",
            unreadCount > 0
              ? "font-medium text-foreground"
              : "text-muted-foreground",
          )}
        >
          {lastMessage ? lastMessage : "No messages yet"}
        </p>
      }
    />
  );
};

export default DirectMessageCart;
