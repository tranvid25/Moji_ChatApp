import type { User } from "@/types/user";
import UserAvatar from "../chat/UserAvatar";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useSocketStore } from "@/stores/useSocketStore";
import AvatarUpload from "./AvatarUpload";
interface ProfileCardProps {
  user: User;
}
const ProfileCard = ({ user }: ProfileCardProps) => {
  const { onlineUsers } = useSocketStore();
  if (!user) return;
  if (!user.bio) {
    <p>{user.bio || "will code for food 🧑‍💻"}</p>;
  }
  const isOnline = onlineUsers.includes(user._id) ? true : false;
  return (
    <Card className="overflow-hidden p-0 h-52 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500">
      <CardContent className="mt-20 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div className="relative">
          <UserAvatar
            type="profile"
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            className="ring-4 ring-white shadow-lg"
          />
          <AvatarUpload />
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {user.displayName}
          </h1>
          {user.bio && (
            <p className="text-white/70 text-sm mt-2 max-w-lg line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>
        <Badge
          className={cn(
            "flex items-center gap-1 capitalize",
            isOnline
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-700",
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full bg-green-500",
              isOnline ? "bg-green-500 animate-pulse" : "bg-slate-500",
            )}
          />
          {isOnline ? "online" : "offline"}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
