import React from "react";
import { useChatStore } from "@/stores/useChatStore";
import GroupChatCart from "./GroupChatCart";
const GroupChatList = () => {
  const { conversations } = useChatStore();
  if (!conversations) return;
  const groupConversations = conversations.filter(
    (convo) => convo.type === "group",
  );
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {groupConversations.map((convo) => (
        <GroupChatCart key={convo._id} convo={convo} />
      ))}
    </div>
  );
};

export default GroupChatList;
