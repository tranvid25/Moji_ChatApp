import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useFriendStore } from "@/stores/useFriendStore";
import SentRequests from "./SentRequests";
import ReceivedRequests from "./ReceivedRequests";

interface FriendRequestDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const FriendRequestDialog = ({ open, setOpen }: FriendRequestDialogProps) => {
  const [tab, setTab] = useState("received");
  const { getAllFriendRequest } = useFriendStore();

  useEffect(() => {
    const loadRequest = async () => {
      try {
        await getAllFriendRequest();
      } catch (error) {
        console.error("Lỗi xảy ra khi tải danh sách lời mời bạn bè:", error);
      }
    };

    loadRequest();
  }, [getAllFriendRequest]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lời mời bạn bè</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex w-full flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="cursor-pointer">
              Đã nhận
            </TabsTrigger>
            <TabsTrigger value="sent" className="cursor-pointer">
              Đã gửi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4 w-full">
            <ReceivedRequests />
          </TabsContent>
          <TabsContent value="sent" className="mt-4 w-full">
            <SentRequests />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FriendRequestDialog;
