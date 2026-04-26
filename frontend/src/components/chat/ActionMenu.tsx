import { useState } from "react";
import { Plus, Code2, Link, FileText, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStores";
import type { Conversation } from "@/types/chat";
import { toast } from "sonner";
import { Input } from "../ui/input";

export default function ActionMenu({ selectedConvo }: { selectedConvo: Conversation }) {
  const [open, setOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage } = useChatStore();

  const handleAction = async (
    type: "code_action" | "document" | "note",
    content: string,
    metadata?: { toolName?: string; link?: string },
    isImportant?: boolean
  ) => {
    if (!user) return;
    try {
      if (selectedConvo.type === "direct") {
        const otherUser = selectedConvo.participants.find((p) => p._id !== user._id);
        if (otherUser) {
          await sendDirectMessage(
            otherUser._id,
            content,
            undefined,
            undefined,
            type,
            undefined,
            metadata,
            isImportant
          );
        }
      } else {
        await sendGroupMessage(
          selectedConvo._id,
          content,
          undefined,
          undefined,
          undefined,
          type,
          undefined,
          metadata,
          isImportant
        );
      }
      setOpen(false);
      setNoteContent("");
    } catch (err) {
      toast.error("Lỗi khi gửi action");
      console.error(err);
    }
  };

  const codeActions = [
    { name: "Visual Studio Code", icon: "visual-studio-code.svg", link: "vscode://" },
    { name: "Cursor", icon: "cursor.svg", link: "cursor://" },
    { name: "Antigravity", icon: "google-antigravity.svg", link: "antigravity://" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full hover:bg-primary/10 transition-smooth"
          title="Thêm hành động"
        >
          <Plus className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden rounded-xl border-border/50 shadow-2xl" align="start" sideOffset={10}>
        <Tabs defaultValue="code" className="w-full flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/30 border-b border-border/40 h-11">
            <TabsTrigger value="code" className="text-xs data-[state=active]:bg-background rounded-none data-[state=active]:shadow-none border-r border-border/40">
              Code
            </TabsTrigger>
            <TabsTrigger value="document" className="text-xs data-[state=active]:bg-background rounded-none data-[state=active]:shadow-none border-r border-border/40">
              Tài liệu
            </TabsTrigger>
            <TabsTrigger value="other" className="text-xs data-[state=active]:bg-background rounded-none data-[state=active]:shadow-none">
              Other
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="p-4 m-0 space-y-3 bg-background">
            <div className="flex items-center gap-2 mb-1">
               <div className="size-6 bg-primary/10 rounded flex items-center justify-center">
                 <Code2 className="size-3.5 text-primary" />
               </div>
               <span className="text-[13px] font-semibold">Công cụ phát triển</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {codeActions.map((action) => (
                <div
                  key={action.name}
                  className="flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-border/60 group"
                  onClick={() =>
                    handleAction("code_action", `Đã mở ${action.name}`, {
                      toolName: action.name,
                      link: action.link,
                    })
                  }
                >
                  <img src={`/${action.icon}`} alt={action.name} className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">{action.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="document" className="p-6 m-0 space-y-4 bg-background flex flex-col items-center justify-center min-h-[160px]">
             <img src="/google-drive.svg" alt="Google Drive" className="w-12 h-12 object-contain drop-shadow-sm mb-1" />
             <div className="space-y-1.5 text-center">
               <h4 className="text-sm font-bold">Thư mục dự án</h4>
               <p className="text-[11px] text-muted-foreground leading-relaxed px-4">Chia sẻ liên kết Google Drive của team cho mọi người.</p>
             </div>
             <Button 
              variant="default"
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 shadow-glow"
              onClick={() => handleAction("document", "Tài liệu team", {
                link: "https://drive.google.com/drive/my-drive"
              })}
             >
               <Link className="size-3.5 mr-2" /> Gửi link tài liệu
             </Button>
          </TabsContent>

          <TabsContent value="other" className="p-4 m-0 space-y-4 bg-background">
             <div className="flex items-center gap-2">
                <img src="/others.svg" className="size-5 object-contain" />
                <span className="text-[13px] font-semibold">Ghi chú quan trọng</span>
             </div>
             <div className="space-y-3">
               <Input 
                 placeholder="Cần lưu ý gì cho team không?" 
                 value={noteContent}
                 onChange={(e) => setNoteContent(e.target.value)}
                 className="text-sm bg-muted/20 border-border/40 focus-visible:ring-1 h-10"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && noteContent.trim()) {
                     handleAction("note", noteContent, undefined, true);
                   }
                 }}
               />
               <Button 
                size="sm" 
                className="w-full"
                disabled={!noteContent.trim()}
                onClick={() => handleAction("note", noteContent, undefined, true)}
               >
                 <Send className="size-3.5 mr-2" /> Gửi dưới dạng Highlight
               </Button>
             </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
