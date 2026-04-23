import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

interface ChatCartProps {
  convoId: string;
  name: string;
  timeStamp?: Date;
  isActive?: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
}
const ChatCart = ({
  convoId,
  name,
  timeStamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
}: ChatCartProps) => {
  return (
    <Card
      key={convoId}
      className={cn(
        "!border-purple-500 !border-solid p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
        isActive &&
          "ring-1 ring-primary/50 bg-linear-to-tr from-primary-glow/10 to-primary-foreground",
      )}
      onClick={() => onSelect(convoId)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">{leftSection}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={cn(
                "font-semibold text-sm truncate",
                unreadCount && unreadCount > 0 && "text-foreground",
              )}
            >
              {name}
            </h3>
            <span className="text-xs text-muted-foreground">
              {timeStamp ? formatOnlineTime(timeStamp) : ""}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {subtitle}
            </div>
            <MoreHorizontal
              className="size-4 text-muted-foreground opacity-0
            group-hover:opacity-100 transition-smooth hover:size-5"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatCart;
