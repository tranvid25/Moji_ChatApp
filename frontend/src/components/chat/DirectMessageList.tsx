import React from "react";
import { useChatStore } from "@/stores/useChatStore";
import DirectMessageCart from "./DirectMessageCart";
const DirectMessageList = () => {
  const { conversations } = useChatStore();
  if (!conversations) return;
  const directConversations = conversations.filter(
    (convo) => convo.type === "direct",
  );
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2 ">
      {directConversations.map((convo) => (
        <DirectMessageCart key={convo._id} convo={convo} />
      ))}
    </div>
  );
};

export default DirectMessageList;
