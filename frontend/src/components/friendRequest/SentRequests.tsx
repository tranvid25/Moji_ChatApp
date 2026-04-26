import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";

const SentRequests = () => {
  const { sentList } = useFriendStore();

  if (!sentList || sentList.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Không có lời mời bạn bè đã gửi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sentList.map((req) => (
        <FriendRequestItem
          key={req._id}
          requestInfo={req}
          actions={
            <div className="w-full border-t border-border pt-3 sm:w-auto sm:border-0 sm:pt-0">
              <p className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground">
                Đang chờ trả lời...
              </p>
            </div>
          }
          type="sent"
        />
      ))}
    </div>
  );
};

export default SentRequests;
