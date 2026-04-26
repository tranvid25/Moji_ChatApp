import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { FileIcon, Download, FileText, Music, MapPin, Video, Reply } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import ActionMenu from "./ActionMenu";

// Fix default icon issue
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
   const { setReplyingToMessage } = useChatStore();
   
   const scrollToMessage = (messageId: string) => {
     const element = document.getElementById(`message-${messageId}`);
     if (element) {
       element.scrollIntoView({ behavior: 'smooth', block: 'center' });
       element.classList.add('highlight-message');
       setTimeout(() => element.classList.remove('highlight-message'), 2000);
     }
   };

  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      1000 * 60 * 5;
  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;
  const hasTextBubble = Boolean(message.content?.trim()) && message.type !== "location" && message.type !== "meeting" && message.type !== "code_action" && message.type !== "document" && message.type !== "note";
  const hasImage = Boolean(message.imgUrl) && message.type !== "file" && message.type !== "audio";
  const isFile = message.type === "file" || Boolean(message.fileUrl && message.type !== "audio");
  const isAudio = message.type === "audio";
  const isLocation = message.type === "location";
  const isMeeting = message.type === "meeting";
  const isCodeAction = message.type === "code_action";
  const isDocument = message.type === "document";
  const isNote = message.type === "note";
  
  const getFileIcon = (fileName?: string | null) => {
    if (!fileName) return <FileIcon className="size-5" />;
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".pdf") || lowerName.endsWith(".docx") || lowerName.endsWith(".txt")) {
      return <FileText className="size-5 text-blue-500" />;
    }
    return <FileIcon className="size-5 text-orange-500" />;
  };

  const fileUrlStr = message.fileUrl ? (message.fileUrl.startsWith('blob:') ? message.fileUrl : `http://localhost:5001${message.fileUrl}`) : '';


  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString(),
  );

  return (
    <div className={cn("flex flex-col", isShowTime ? "mt-4" : "mt-1")}>
      {isShowTime && (
        <div className="flex w-full justify-center py-1">
          <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            {formatMessageTime(new Date(message.createdAt))}
          </span>
        </div>
      )}

      <div
        id={`message-${message._id}`}
        className={cn(
          "flex w-full items-end gap-2 group message-bounce",
          message.isOwn ? "justify-end" : "justify-start",
          !message.isOwn && isGroupBreak ? "mt-1" : "mt-0.5",
        )}
      >
        {!message.isOwn && (
          <div className="flex w-10 shrink-0 justify-center">
            {isGroupBreak ? (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "TVChat"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            ) : (
              <div className="size-8" />
            )}
          </div>
        )}

        <div
          className={cn(
            "flex min-w-0 max-w-[85%] flex-col space-y-1 sm:max-w-xs lg:max-w-md relative",
            message.isOwn ? "items-end" : "items-start",
          )}
        >
          {message.replyTo && (
            <div 
              onClick={() => scrollToMessage(message.replyTo?._id || '')}
              className={cn(
                "mb-px px-3 py-1.5 rounded-t-2xl rounded-b-md bg-muted/40 border-l-4 border-primary/40 cursor-pointer hover:bg-muted/60 transition-colors max-w-full overflow-hidden",
                message.isOwn ? "mr-1" : "ml-1"
              )}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                <Reply className="size-3" />
                <span>Trả lời</span>
              </div>
              <p className="text-xs text-muted-foreground truncate italic">
                {message.replyTo.content || '[Media]'}
              </p>
            </div>
          )}
          {hasImage && (
            <div
              className={cn(
                "w-fit max-w-full overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm relative",
                message.isSending && "opacity-70",
              )}
            >
              <img
                src={message.imgUrl || ""}
                alt="image-message"
                className="max-h-[360px] w-auto max-w-[280px] object-cover sm:max-w-[340px]"
                loading="lazy"
              />
              {message.isSending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                  <div className="flex flex-col items-center gap-1">
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-[10px] font-medium text-white drop-shadow-md">
                      Đang gửi..
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasTextBubble && (
            <div className="flex flex-col items-end gap-1">
              <Card
                className={cn(
                  "w-fit max-w-full rounded-2xl px-3 py-2.5 shadow-sm transition-shadow",
                  message.isOwn
                    ? "chat-bubble-sent border-0"
                    : "bg-chat-bubble-received border border-primary/25",
                  message.isSending && "opacity-70",
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                  {message.content}
                </p>
              </Card>
            </div>
          )}

          {isFile && (
            <Card
              className={cn(
                "flex items-center gap-3 p-3 w-64 max-w-full rounded-2xl shadow-sm border",
                message.isOwn
                  ? "bg-primary/10 border-primary/20 text-primary-foreground"
                  : "bg-background border-border/50"
              )}
            >
              <div className="shrink-0">
                {getFileIcon(message.fileName)}
              </div>
              <div className="flex flex-col overflow-hidden w-full">
                <span className="text-sm font-medium truncate w-full block text-foreground">
                  {message.fileName || "Tệp đính kèm"}
                </span>
                <span className="text-xs text-muted-foreground">Tài liệu</span>
              </div>
              {!message.isSending && fileUrlStr && (
                <a
                  href={fileUrlStr}
                  target="_blank"
                  rel="noreferrer"
                  download={message.fileName || "file"}
                  className="shrink-0 p-1.5 hover:bg-black/5 rounded-full transition-colors ml-auto text-foreground"
                >
                  <Download className="size-4" />
                </a>
              )}
            </Card>
          )}

          {isAudio && (
            <Card
              className={cn(
                "flex justify-center items-center py-2 px-3 rounded-2xl border min-w-44 max-w-full",
                message.isOwn ? "bg-primary/10 border-primary/20" : "bg-card border-border/50"
              )}
            >
              <Music className="size-4 text-primary mr-2" />
              {fileUrlStr ? (
                <audio controls src={fileUrlStr} className="h-8 max-w-[200px]" />
              ) : (
                <span className="text-sm italic text-muted-foreground mr-1">Đang xử lý âm thanh...</span>
              )}
            </Card>
          )}

          {isLocation && message.content && (
             <Card className="rounded-2xl p-2 border-border/50 bg-card w-[280px] max-w-full overflow-hidden shadow-sm">
                <div className="flex items-center mb-2 px-1 text-primary">
                    <MapPin className="size-4 mr-1" />
                    <span className="text-sm font-medium text-foreground">Vị trí</span>
                </div>
                <div className="h-40 w-full rounded-[10px] overflow-hidden z-0 relative isolate">
                  {message.content && message.content.split(',').length === 2 ? (
                    <MapContainer 
                      center={[parseFloat(message.content.split(',')[0]), parseFloat(message.content.split(',')[1])]} 
                      zoom={14} 
                      className="h-full w-full"
                      zoomControl={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[parseFloat(message.content.split(',')[0]), parseFloat(message.content.split(',')[1])]}>
                      </Marker>
                    </MapContainer>
                  ) : <p className="text-sm text-foreground p-2">{message.content}</p>}
                </div>
             </Card>
          )}

          {isMeeting && message.content && (
            <Card className="rounded-2xl p-4 border-border/50 bg-chat-bubble-received border-primary/20 shadow-sm w-64 max-w-full flex flex-col items-center gap-3">
               <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                 <Video className="size-6 text-primary" />
               </div>
               <div className="flex flex-col items-center gap-1 w-full">
                 <span className="font-semibold text-foreground text-sm uppercase tracking-wide">Họp nhóm</span>
                 <p className="text-xs text-muted-foreground w-full text-center truncate italic">{message.content}</p>
               </div>
               <Button 
                onClick={() => window.open(message.content!, "_blank")} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-1 shadow-glow transition-smooth"
               >
                 Tham gia ngay
               </Button>
            </Card>
          )}

          {isCodeAction && (
            <Card className="rounded-2xl p-4 border-border/50 bg-card shadow-sm w-64 max-w-full flex flex-col items-center gap-3">
               <div className="size-10 flex items-center justify-center bg-muted/50 rounded-lg p-1.5">
                 {message.metadata?.toolName === 'Visual Studio Code' ? (
                    <img src="/visual-studio-code.svg" className="w-full h-full object-contain" />
                 ) : message.metadata?.toolName === 'Cursor' ? (
                    <img src="/cursor.svg" className="w-full h-full object-contain" />
                 ) : message.metadata?.toolName === 'Antigravity' ? (
                    <img src="/google-antigravity.svg" className="w-full h-full object-contain" />
                 ) : (
                    <FileIcon className="size-6 text-primary" />
                 )}
               </div>
               <div className="flex flex-col items-center gap-1 w-full text-center">
                 <span className="font-semibold text-foreground text-sm uppercase tracking-wide">Mở Code Tool</span>
                 <p className="text-xs text-muted-foreground w-full truncate" title={message.content!}>{message.content}</p>
               </div>
               {message.metadata?.link && (
                 <Button 
                  onClick={() => window.open(message.metadata!.link, "_blank")} 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-1 transition-smooth"
                 >
                   Mở {message.metadata.toolName}
                 </Button>
               )}
            </Card>
          )}

          {isDocument && (
            <Card className="rounded-2xl p-4 border-border/50 bg-card w-64 max-w-full shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <img src="/google-drive.svg" alt="Drive" className="w-8 h-8 object-contain shrink-0" />
                   <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold text-foreground truncate">Tài liệu team</span>
                      <span className="text-xs text-muted-foreground truncate" title={message.content!}>{message.content}</span>
                   </div>
                </div>
                {message.metadata?.link && (
                  <Button 
                   size="sm"
                   variant="outline"
                   onClick={() => window.open(message.metadata!.link, "_blank")} 
                   className="w-full"
                  >
                    Open Google Drive
                  </Button>
                )}
            </Card>
          )}

          {isNote && (
            <Card className={cn(
              "max-w-[85%] sm:max-w-xs lg:max-w-md rounded-2xl px-4 py-3 shadow-md border-l-4",
              message.isImportant ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500" : "bg-muted border-primary/50"
            )}>
              <div className="flex items-center gap-1.5 mb-1.5">
                 <FileText className={cn("size-3.5", message.isImportant ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
                 <span className={cn("text-xs font-bold uppercase", message.isImportant ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                   Ghi chú nội bộ
                 </span>
              </div>
              <p className={cn("whitespace-pre-wrap wrap-break-word text-sm leading-relaxed", message.isImportant ? "text-amber-900 dark:text-amber-100" : "text-foreground")}>
                {message.content}
              </p>
            </Card>
          )}


          {message.isOwn &&
            !message.isSending &&
            message._id === selectedConvo.lastMessage?._id && (
              <Badge
                variant="outline"
                className={cn(
                  "h-4 border-0 px-1.5 py-0.5 text-[11px] capitalize",
                  lastMessageStatus === "seen"
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {lastMessageStatus}
              </Badge>
            )}
        </div>

        {/* Reply Action Button */}
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity flex items-center mb-1 gap-0.5",
          message.isOwn ? "order-first mr-1 flex-row-reverse" : "ml-1"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full hover:bg-muted text-muted-foreground"
            onClick={() => setReplyingToMessage(message)}
            title="Trả lời"
          >
            <Reply className="size-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full hover:bg-muted text-primary"
            onClick={() => window.open("https://meet.google.com/new", "_blank")}
            title="Họp nhanh"
          >
            <span role="img" aria-label="call" className="text-sm">📞</span>
          </Button>

          <ActionMenu selectedConvo={selectedConvo} />
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
