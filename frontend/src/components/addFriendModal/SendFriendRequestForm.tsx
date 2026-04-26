import React from "react";
import type { IFormValues } from "../chat/AddFriendModal";
import type { UseFormRegister } from "react-hook-form";
import { Textarea } from "../ui/textarea";
import { DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus } from "lucide-react";
interface SendRequestProps {
  register: UseFormRegister<IFormValues>;
  loading: boolean;
  searchedUsername: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}
const SendFriendRequestForm = ({
  register,
  loading,
  searchedUsername,
  onSubmit,
  onBack,
}: SendRequestProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-2">
        <span className="success-message">
          Tìm thấy <span className="font-semibold">@{searchedUsername}</span>
          rồi nè 🥳
        </span>
        <div className="space-y-4">
          <label htmlFor="message" className="text-sm font-semibold">
            Giới thiệu
          </label>
          <Textarea
            id="message"
            rows={3}
            placeholder="Chào bạn có thể kết bạn được không?..."
            className="glass border-border/50 focus:border-primary/50 transition-smooth resize-none mt-2"
            {...register("message")}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="flex-1 glass hover:text-destructive"
            onClick={onBack}
          >
            Quay lại
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
          >
            {loading ? (
              <span>Đang gửi...</span>
            ) : (
              <>
                <UserPlus className="size-4 mr-2" />
                Kết Bạn
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    </form>
  );
};

export default SendFriendRequestForm;
