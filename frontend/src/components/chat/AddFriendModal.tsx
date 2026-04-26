import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import SeachForm from "../addFriendModal/SeachForm";
import SendFriendRequestForm from "../addFriendModal/SendFriendRequestForm";
export interface IFormValues {
  username: string;
  message?: string;
}
const AddFriendModal = () => {
  const [isFound, setIsFound] = useState<boolean | null>(null);
  const [searchUser, setSearchUser] = useState<User>();
  const [searchedUsername, setSearchedUsername] = useState("");
  const { loading, searchByUsername, addFriend } = useFriendStore();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IFormValues>({
    defaultValues: {
      username: "",
      message: "",
    },
  });
  const usernameValue = watch("username");
  const handleSearch = handleSubmit(async (data) => {
    const username = (data.username ?? "").trim();
    if (!username) return;
    setIsFound(null);
    setSearchedUsername(username);
    try {
      const foundUser = await searchByUsername(username);
      if (foundUser) {
        setIsFound(true);
        setSearchUser(foundUser);
      } else {
        setIsFound(false);
      }
    } catch (error) {
      console.error(error);
      setIsFound(false);
    }
  });
  const handleSend = handleSubmit(async (data) => {
    if (!searchUser) return;
    try {
      const successMessage = await addFriend(
        searchUser._id,
        (data.message ?? "").trim(),
      );
      toast.success(successMessage || "Đã gửi lời mời kết bạn");
      reset();
      setSearchedUsername("");
      setIsFound(null);
      handleCancel();
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Gửi lời mời thất bại";
      toast.error(String(errorMessage));
    }
  });
  const handleCancel = () => {
    reset();
    setSearchedUsername("");
    setIsFound(null);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
          <UserPlus className="size-4" />
          <span className="sr-only">Kết bạn</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle>Kết bạn</DialogTitle>
        </DialogHeader>
        {!isFound && (
          <>
            <SeachForm
              register={register}
              errors={errors}
              loading={loading}
              usernameValue={usernameValue}
              isFound={isFound}
              searchedUsername={searchedUsername}
              onSubmit={handleSearch}
              onCancel={handleCancel}
            />
          </>
        )}
        {isFound && (
          <>
            <SendFriendRequestForm
              register={register}
              loading={loading}
              searchedUsername={searchedUsername}
              onSubmit={handleSend}
              onBack={() => setIsFound(null)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
