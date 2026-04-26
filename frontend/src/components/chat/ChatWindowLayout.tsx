import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import ChatWindowSkeleton from "./ChatWindowSkeleton";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect, useState } from "react";
const ChatWindowLayout = () => {
  const {
    activeConversationId,
    messages,
    conversations,
    messageLoading: loading,
    markAsSeen,
  } = useChatStore();
  const selectedConvo =
    conversations.find((convo) => convo._id === activeConversationId) ?? null;
  useEffect(() => {
    if (!selectedConvo) return;
    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.error("Lỗi xảy ra khi đánh dấu là đã đọc", error);
      }
    };
    markSeen();
  }, [markAsSeen, selectedConvo]);
  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }
  if (loading) {
    return <ChatWindowSkeleton />;
  }
  return (
    <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md">
      <ChatWindowHeader chat={selectedConvo} />
      <div className="flex-1 overflow-y-auto bg-primary-foreground">
        <ChatWindowBody />
      </div>
      <MessageInput selectedConvo={selectedConvo} />
    </SidebarInset>
  );
};

export default ChatWindowLayout;
