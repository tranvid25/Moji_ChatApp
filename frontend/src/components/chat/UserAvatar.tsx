import React from "react";
import { cn } from "@/lib/utils";
import { AvatarImage, AvatarFallback, Avatar } from "../ui/avatar";

interface IUserAvatarProps {
  type: "sidebar" | "chat" | "conversation" | "profile";
  name?: string;
  avatarUrl?: string;
  className?: string;
}

const UserAvatar = ({ type, name, avatarUrl, className }: IUserAvatarProps) => {
  const displayName = name || "TVChat";
  const bgColor = !avatarUrl ? "bg-blue-500" : "";

  return (
    <Avatar
      className={cn(
        className ?? "",
        type === "sidebar" && "size-12 text-base",
        type === "chat" && "size-8 text-sm",
        type === "profile" && "size-24 text-3xl shadow-md",
      )}
    >
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback className={`${bgColor} text-white font-semibold`}>
        {displayName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
