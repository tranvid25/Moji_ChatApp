import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import type { Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Participant[];
  groupName?: string;
}

const GroupMembersDialog = ({
  open,
  onOpenChange,
  members,
  groupName,
}: GroupMembersDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thành viên nhóm</DialogTitle>
          <DialogDescription>
            {groupName ? `Nhóm: ${groupName}` : "Danh sách thành viên"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có thành viên</p>
          ) : (
            members.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 rounded-md border border-border/40 px-3 py-2"
              >
                <UserAvatar
                  type="chat"
                  name={member.displayName}
                  avatarUrl={member.avatarUrl ?? undefined}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.displayName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersDialog;
