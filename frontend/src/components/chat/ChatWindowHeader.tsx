import { useState } from "react";
import { EllipsisVertical, Users, LogOut, PencilLine, BellOff, Bell } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStores";
import { useUserStore } from "@/stores/useUserStore";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import GroupMembersDialog from "./GroupMembersDialog";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { activeConversationId, conversations } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { leaveGroupConversation, renameGroupConversation, muteGroupConversation } =
    useUserStore();

  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  let otherUser;
  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers?.length > 0 ? otherUsers[0] : null;
    if (!user || !otherUser) return;
  }

  const isMuted = chat.type === "group" && user
    ? (chat.mutedBy || []).includes(user._id)
    : false;

  const handleRenameGroup = async () => {
    if (!chat || chat.type !== "group" || !newGroupName.trim()) return;
    try {
      await renameGroupConversation(chat._id, newGroupName.trim());
      setShowRenameDialog(false);
      setNewGroupName("");
    } catch (error) {
      console.error("Lỗi đổi tên nhóm", error);
    }
  };

  const handleToggleMute = async () => {
    if (!chat || chat.type !== "group") return;
    try {
      await muteGroupConversation(chat._id, !isMuted);
    } catch (error) {
      console.error("Lỗi khi đổi trạng thái tắt thông báo", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!chat || chat.type !== "group") return;
    try {
      await leaveGroupConversation(chat._id);
    } catch (error) {
      console.error("Lỗi khi rời nhóm", error);
    }
  };

  return (
    <>
      <GroupMembersDialog
        open={showGroupMembers}
        onOpenChange={setShowGroupMembers}
        members={chat.participants}
        groupName={chat.group?.name}
      />

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi tên nhóm</DialogTitle>
            <DialogDescription>
              Nhập tên mới cho cuộc trò chuyện nhóm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nhập tên nhóm mới"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleRenameGroup} disabled={!newGroupName.trim()}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4 "
          />
          <div className="p-2 w-full flex items-center gap-3">
            <div className="relative">
              {chat.type === "direct" ? (
                <>
                  <UserAvatar
                    type={"sidebar"}
                    name={otherUser?.displayName || "Moji"}
                  />
                  <StatusBadge
                    status={
                      onlineUsers.includes(otherUser?._id ?? "")
                        ? "online"
                        : "offline"
                    }
                  />
                </>
              ) : (
                <GroupChatAvatar participants={chat.participants} type={"sidebar"} />
              )}
            </div>

            <h2 className="font-semibold text-foreground">
              {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
            </h2>

            {chat.type === "group" && (
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <EllipsisVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-56">
                    <DropdownMenuItem onClick={() => setShowGroupMembers(true)}>
                      <Users className="mr-2 size-4" />
                      Xem thành viên nhóm
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        setNewGroupName(chat?.group?.name || "");
                        setShowRenameDialog(true);
                      }}
                    >
                      <PencilLine className="mr-2 size-4" />
                      Đổi tên nhóm
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleToggleMute}>
                      {isMuted ? (
                        <>
                          <Bell className="mr-2 size-4" />
                          Bật thông báo nhóm
                        </>
                      ) : (
                        <>
                          <BellOff className="mr-2 size-4" />
                          Tắt thông báo nhóm
                        </>
                      )}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleLeaveGroup}
                      className="text-destructive"
                    >
                      <LogOut className="mr-2 size-4" />
                      Rời nhóm
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default ChatWindowHeader;
