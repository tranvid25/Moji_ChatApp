import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}
const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const prev = messages[index - 1];
  const isGroupBreak =
    index === 0 ||
    message.senderId !== prev?.senderId ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      1000 * 60 * 5;
  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString(),
  );
  return (
    <div
      className={cn(
        "flex w-full gap-2 mt-1 message-bounce",
        message.isOwn ? "justify-end" : "justify-start",
      )}
    >
      {!message.isOwn && (
        <div className="w-10 shrink-0 flex justify-center">
          {isGroupBreak ? (
            <UserAvatar
              type="chat"
              name={participant?.displayName ?? "Moji"}
              avatarUrl={participant?.avatarUrl ?? undefined}
            />
          ) : (
            <div className="size-8" />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-xs lg:max-w-md flex-col space-y-1 min-w-0",
          message.isOwn ? "items-end" : "items-start",
        )}
      >
        <Card
          className={cn(
            "w-fit max-w-full p-3",
            message.isOwn
              ? "chat-bubble-sent border-0"
              : "bg-chat-bubble-received border-primary/40",
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
            {message.content}
          </p>
        </Card>

        {isGroupBreak && (
          <span className="px-1 text-xs text-muted-foreground">
            {formatMessageTime(new Date(message.createdAt))}
          </span>
        )}

        {message.isOwn &&
          message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "h-4 border-0 px-1.5 py-0.5 text-xs",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
      </div>
    </div>
  );
};

export default MessageItem;
