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
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      1000 * 60 * 5;
  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;
  const hasText = Boolean(message.content?.trim());
  const hasImage = Boolean(message.imgUrl);

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString(),
  );

  return (
    <div className={cn("flex flex-col", isShowTime ? "mt-4" : "mt-1")}>
      {isShowTime && (
        <div className="flex w-full justify-center py-1">
          <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            {formatMessageTime(new Date(message.createdAt))}
          </span>
        </div>
      )}

      <div
        className={cn(
          "flex w-full items-end gap-2 message-bounce",
          message.isOwn ? "justify-end" : "justify-start",
          !message.isOwn && isGroupBreak ? "mt-1" : "mt-0.5",
        )}
      >
        {!message.isOwn && (
          <div className="flex w-10 shrink-0 justify-center">
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
            "flex min-w-0 max-w-xs flex-col space-y-1 lg:max-w-md",
            message.isOwn ? "items-end" : "items-start",
          )}
        >
          {hasImage && (
            <div
              className={cn(
                "w-fit max-w-full overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm relative",
                message.isSending && "opacity-70",
              )}
            >
              <img
                src={message.imgUrl || ""}
                alt="image-message"
                className="max-h-[360px] w-auto max-w-[280px] object-cover sm:max-w-[340px]"
                loading="lazy"
              />
              {message.isSending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-[10px] font-medium text-white drop-shadow-md">
                      Đang gửi..
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasText && (
            <div className="flex flex-col items-end gap-1">
              <Card
                className={cn(
                  "w-fit max-w-full rounded-2xl px-3 py-2.5 shadow-sm transition-shadow",
                  message.isOwn
                    ? "chat-bubble-sent border-0"
                    : "bg-chat-bubble-received border border-primary/25",
                  message.isSending && "opacity-70",
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                  {message.content}
                </p>
              </Card>
              {/* {message.isSending && (
                <span className="text-[10px] text-muted-foreground mr-1">
                  Đang gửi...
                </span>
              )} */}
            </div>
          )}

          {message.isOwn &&
            !message.isSending &&
            message._id === selectedConvo.lastMessage?._id && (
              <Badge
                variant="outline"
                className={cn(
                  "h-4 border-0 px-1.5 py-0.5 text-[11px] capitalize",
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
    </div>
  );
};

export default MessageItem;
