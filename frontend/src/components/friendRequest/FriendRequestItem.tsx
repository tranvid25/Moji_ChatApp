import type { ReactNode } from "react";
import UserAvatar from "../chat/UserAvatar";
import type { FriendRequest } from "@/types/user";

interface RequestItemProps {
  requestInfo: FriendRequest;
  actions: ReactNode;
  type: "sent" | "received";
}

const FriendRequestItem = ({
  requestInfo,
  actions,
  type,
}: RequestItemProps) => {
  if (!requestInfo) {
    return null;
  }
  const info = type === "sent" ? requestInfo.to : requestInfo.from;
  if (!info) {
    return;
  }
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          type="sidebar"
          name={info.displayName}
          avatarUrl={info.avatarUrl}
        />
        <div className="min-w-0">
          <p className="truncate font-medium">{info.displayName}</p>
          <p className="truncate text-sm text-muted-foreground">@{info.username}</p>
        </div>
      </div>

      <div className="mt-3 flex w-full items-center justify-end gap-2 border-t border-border pt-3">
        {actions}
      </div>
    </div>
  );
};

export default FriendRequestItem;
