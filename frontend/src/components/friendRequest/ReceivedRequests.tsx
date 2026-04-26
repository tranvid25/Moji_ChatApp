import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";
import { Button } from "../ui/button";
import { toast } from "sonner";

const ReceivedRequests = () => {
  const { acceptRequest, declineRequest, loading, receivedList } =
    useFriendStore();
  if (!receivedList || receivedList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Không có lời mời bạn bè nhận
      </p>
    );
  }
  const handleAccept = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
      toast.success("Đã đồng ý kết bạn thành công");
    } catch (error) {
      console.error("Lỗi khi chấp nhận lời mời bạn bè:", error);
    }
  };
  const handleDecline = async (requestId: string) => {
    try {
      await declineRequest(requestId);
      toast.info("Đã từ chối lời mời bạn bè");
    } catch (error) {
      console.error("Lỗi khi từ chối lời mời bạn bè:", error);
    }
  };
  return (
    <div className="mt-4 space-y-3">
      {receivedList.map((req) => (
        <FriendRequestItem
          key={req._id}
          requestInfo={req}
          actions={
            <>
              <Button
                variant="primary"
                size="sm"
                className="min-w-24"
                onClick={() => handleAccept(req._id)}
                disabled={loading}
              >
                Chấp nhận
              </Button>
              <Button
                variant="destructiveOutline"
                size="sm"
                className="min-w-24"
                onClick={() => handleDecline(req._id)}
                disabled={loading}
              >
                Từ chối
              </Button>
            </>
          }
          type="received"
        />
      ))}
    </div>
  );
};

export default ReceivedRequests;
