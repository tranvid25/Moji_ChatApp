import { useAuthStore } from "@/stores/useAuthStores";
import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Paperclip, Send, X, File as FileIcon, Mic, Square, MapPin, Music, CalendarPlus } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";
import { useChatStore } from "@/stores/useChatStore";
import { useUserStore } from "@/stores/useUserStore";
import { toast } from "sonner";
import GroupBlockedConfirmDialog from "./GroupBlockedConfirmDialog";
import { compressImageToWebP } from "@/lib/imageUtils";
import AppointmentDialog from "./AppointmentDialog";
import { Reply, X as CloseIcon } from "lucide-react";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const [value, setValue] = useState("");
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [pendingGroupMessage, setPendingGroupMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendDirectMessage, sendGroupMessage, replyingToMessage, setReplyingToMessage } = useChatStore();
  const { leaveGroupConversation } = useUserStore();

  if (!user) return;

  const resetPickedImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File tải lên tối đa là 10MB");
      return;
    }

    setImageFile(file);
    if (file.type.startsWith("image/")) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview("file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File tải lên tối đa là 10MB");
      return;
    }

    setImageFile(file);
    if (file.type.startsWith("image/")) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview("file");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.mp3`, { type: "audio/mp3" });
        setImageFile(audioFile);
        setImagePreview("audio");
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      toast.error("Không thể truy cập microphone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ Geolocation");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordsStr = `${position.coords.latitude},${position.coords.longitude}`;
        try {
          if (selectedConvo.type === "direct") {
            const otherUser = selectedConvo.participants.find((p) => p._id !== user._id);
            if (otherUser) {
              await sendDirectMessage(otherUser._id, coordsStr, undefined, undefined, "location");
            }
          } else {
            await sendGroupMessage(selectedConvo._id, coordsStr, undefined, undefined, undefined, "location");
          }
        } catch (err) {
          toast.error("Lỗi khi gửi vị trí");
        }
      },
      () => toast.error("Không thể lấy vị trí")
    );
  };

  const handleContinueGroupMessage = async () => {
    let finalImageFile = imageFile;
    if (imageFile && imageFile.type.startsWith("image/")) {
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
      if (imageFile && imageFile.type.startsWith("image/")) {
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

      const meetRegex = /^https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+[a-zA-Z0-9-?&=]*$/;
      let messageType = undefined;
      if (meetRegex.test(currValue.trim()) && !finalImageFile) {
        messageType = "meeting";
      }

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(
          otherUser._id,
          currValue,
          undefined,
          finalImageFile ?? undefined,
          messageType
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
        messageType
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
      <AppointmentDialog 
        open={showAppointmentDialog} 
        onOpenChange={setShowAppointmentDialog} 
      />
      
      {replyingToMessage && (
        <div className="px-3 py-2 bg-muted/20 border-t border-x border-border/40 rounded-t-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="shrink-0 text-primary">
              <Reply className="size-4" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Đang trả lời</span>
              <p className="text-xs text-muted-foreground truncate italic">
                {replyingToMessage.content || (replyingToMessage.type === 'image' ? '[Hình ảnh]' : replyingToMessage.type === 'file' ? '[Tệp]' : '[Tin nhắn]')}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-6 hover:bg-muted" 
            onClick={() => setReplyingToMessage(null)}
          >
            <CloseIcon className="size-3" />
          </Button>
        </div>
      )}

      <div 
        className={cn(
          "p-3 min-h-[56px] bg-background space-y-2 border-t",
          replyingToMessage && "rounded-b-xl border-t-0 shadow-sm"
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {imagePreview && (
          <div className="relative inline-block max-w-40 rounded-md border border-border/40 p-1 bg-muted/30">
            {imageFile?.type.startsWith("image/") ? (
              <img
                src={imagePreview}
                alt="preview"
                className="max-h-28 rounded object-cover"
              />
            ) : imagePreview === "audio" ? (
              <div className="flex flex-col items-center justify-center p-3 h-28 w-28 text-center text-muted-foreground">
                <Music className="size-8 text-primary/70 mb-2" />
                <span className="text-[10px] w-full truncate font-medium">Bản ghi âm thanh</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 h-28 w-28 text-center text-muted-foreground">
                <FileIcon className="size-8 text-primary/70 mb-2" />
                <span className="text-[10px] w-full truncate font-medium">
                  {imageFile?.name}
                </span>
                <span className="text-[9px]">
                  {(imageFile?.size ? imageFile.size / (1024 * 1024) : 0).toFixed(2)} MB
                </span>
              </div>
            )}
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

        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.csv,.docx,.txt,.xlsx,.mp3,.wav,.ogg"
            className="hidden"
            onChange={handlePickFile}
          />
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 transition-smooth hidden sm:inline-flex"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 transition-smooth"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("hover:bg-primary/10 transition-smooth", isRecording && "text-red-500")}
            onClick={() => isRecording ? stopRecording() : startRecording()}
          >
            {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 transition-smooth hidden sm:inline-flex"
            onClick={sendLocation}
          >
            <MapPin className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 transition-smooth hidden sm:inline-flex"
            onClick={() => setShowAppointmentDialog(true)}
            title="Tạo lịch hẹn"
          >
            <CalendarPlus className="size-4" />
          </Button>
          <div className="flex-1 relative ml-1">
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
