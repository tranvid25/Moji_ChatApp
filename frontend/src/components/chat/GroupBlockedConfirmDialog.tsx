import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface GroupBlockedConfirmDialogProps {
  open: boolean;
  onContinue: () => Promise<void> | void;
  onLeaveGroup: () => Promise<void> | void;
}

const GroupBlockedConfirmDialog = ({
  open,
  onContinue,
  onLeaveGroup,
}: GroupBlockedConfirmDialogProps) => {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Xác nhận gửi tin nhắn</DialogTitle>
          <DialogDescription>
            Trong nhóm có người bạn đã chặn. Bạn có muốn tiếp tục nhắn tin không?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onLeaveGroup}>
            Không, rời nhóm
          </Button>
          <Button onClick={onContinue}>Có, tiếp tục nhắn</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupBlockedConfirmDialog;
