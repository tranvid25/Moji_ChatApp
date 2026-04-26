import { useAuthStore } from "@/stores/useAuthStores";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import type { Conversation } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";
import GroupBlockedConfirmDialog from "./GroupBlockedConfirmDialog";
import { compressImageToWebP } from "@/lib/imageUtils";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState("");
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [pendingGroupMessage, setPendingGroupMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendDirectMessage, sendGroupMessage } = useChatStore();
  const { leaveGroupConversation } = useUserStore();

  if (!user) return;

  const resetPickedImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ file ảnh");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleContinueGroupMessage = async () => {
    let finalImageFile = imageFile;
    if (imageFile) {
      try {
        const blob = await compressImageToWebP(imageFile);
        finalImageFile = new File(
          [blob],
          imageFile.name.replace(/\.[^/.]+$/, "") + ".webp",
          {
            type: "image/webp",
          },
        );
      } catch (compressionError) {
        console.error("Compression failed, using original file", compressionError);
      }
    }

    try {
      await sendGroupMessage(
        selectedConvo._id,
        pendingGroupMessage,
        undefined,
        true,
        finalImageFile ?? undefined,
      );
      setPendingGroupMessage("");
      setShowBlockedDialog(false);
      resetPickedImage();
    } catch (retryError) {
      console.error(retryError);
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại");
      setValue(pendingGroupMessage);
      setShowBlockedDialog(false);
      setPendingGroupMessage("");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroupConversation(selectedConvo._id);
      setShowBlockedDialog(false);
      setPendingGroupMessage("");
    } catch (leaveError) {
      console.error(leaveError);
      toast.error("Không thể rời nhóm. Vui lòng thử lại");
      setValue(pendingGroupMessage);
      setShowBlockedDialog(false);
      setPendingGroupMessage("");
    }
  };

  const sendMessage = async () => {
    if ((!value.trim() && !imageFile) || isSending) return;
    const currValue = value;
    setValue("");
    setIsSending(true);

    try {
      let finalImageFile = imageFile;
      if (imageFile) {
        try {
          const blob = await compressImageToWebP(imageFile);
          finalImageFile = new File(
            [blob],
            imageFile.name.replace(/\.[^/.]+$/, "") + ".webp",
            {
              type: "image/webp",
            },
          );
        } catch (compressionError) {
          console.error("Compression failed, using original file", compressionError);
        }
      }

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(
          otherUser._id,
          currValue,
          undefined,
          finalImageFile ?? undefined,
        );
        resetPickedImage();
        return;
      }

      await sendGroupMessage(
        selectedConvo._id,
        currValue,
        undefined,
        undefined,
        finalImageFile ?? undefined,
      );
      resetPickedImage();
    } catch (error: any) {
      const apiCode = error?.response?.data?.code;

      if (apiCode === "DIRECT_MESSAGE_BLOCKED") {
        toast.error("Bạn không thể nhắn tin vì đã chặn hoặc bị chặn");
        return;
      }

      if (apiCode === "GROUP_BLOCKED_MEMBER_CONFIRM_REQUIRED") {
        setPendingGroupMessage(currValue);
        setShowBlockedDialog(true);
        return;
      }

      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
      setValue(currValue);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <GroupBlockedConfirmDialog
        open={showBlockedDialog}
        onContinue={handleContinueGroupMessage}
        onLeaveGroup={handleLeaveGroup}
      />
      <div className="p-3 min-h-[56px] bg-background space-y-2">
        {imagePreview && (
          <div className="relative inline-block max-w-40 rounded-md border border-border/40 p-1">
            <img
              src={imagePreview}
              alt="preview"
              className="max-h-28 rounded object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 size-6"
              onClick={resetPickedImage}
            >
              <X className="size-3" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePickImage}
          />
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 transition-smooth"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              onKeyPress={handleKeyPress}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Soạn tin nhắn.."
              className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
            ></Input>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 hover:bg-primary/10 transition-smooth"
              >
                <div>
                  <EmojiPicker
                    onChange={(emoji: string) => setValue(`${value}${emoji}`)}
                  />
                </div>
              </Button>
            </div>
          </div>
          <Button
            onClick={sendMessage}
            className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
            disabled={(!value.trim() && !imageFile) || isSending}
          >
            <Send className="size-4 text-white" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default MessageInput;
