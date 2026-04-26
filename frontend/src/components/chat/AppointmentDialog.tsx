import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { appointmentService } from "@/services/appointmentService";
import { useChatStore } from "@/stores/useChatStore";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AppointmentDialog = ({ open, onOpenChange }: AppointmentDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { activeConversationId } = useChatStore();

  const handleCreate = async () => {
    if (!title.trim() || !date || !startTimeStr || !endTimeStr) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc");
      return;
    }

    const startSplit = startTimeStr.split(":");
    const endSplit = endTimeStr.split(":");

    const start = new Date(date);
    start.setHours(parseInt(startSplit[0], 10), parseInt(startSplit[1], 10), 0, 0);

    const end = new Date(date);
    end.setHours(parseInt(endSplit[0], 10), parseInt(endSplit[1], 10), 0, 0);

    if (start >= end) {
      toast.error("Thời gian bắt đầu phải trước thời gian kết thúc");
      return;
    }

    if (start <= new Date()) {
        toast.error("Vui lòng chọn thời gian trong tương lai");
        return;
    }

    try {
      setLoading(true);
      const res = await appointmentService.createAppointment({
        title,
        description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        conversationId: activeConversationId || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
      });

      toast.success("Tạo lịch hẹn thành công!");

      // Tạo Google Calendar Link
      const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&dates=${formatTime(start)}/${formatTime(end)}`;

      // Reset form
      setTitle("");
      setDescription("");
      setStartTimeStr("");
      setEndTimeStr("");
      setMeetingUrl("");
      onOpenChange(false);
      
      toast('Thêm vào Google Calendar?', {
        action: {
          label: 'Mở Calendar',
          onClick: () => window.open(googleCalendarUrl, "_blank")
        },
        duration: 10000,
      });

    } catch (error) {
      console.error(error);
      toast.error("Không thể tạo lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo Lịch Hẹn</DialogTitle>
          <DialogDescription>
            Điền thông tin lịch hẹn để nhận lời nhắc trước khi bắt đầu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Input
              id="title"
              placeholder="Tiêu đề cuộc hẹn"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Bắt đầu</span>
                <Input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">Kết thúc</span>
                <Input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                />
              </div>
          </div>

          <div className="flex flex-col gap-2">
            <Textarea
              id="description"
              placeholder="Mô tả..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Input
              id="meetingUrl"
              placeholder="Link Google Meet (Tuỳ chọn)"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleCreate} disabled={loading || !title || !date || !startTimeStr || !endTimeStr}>
            {loading ? "Đang xử lý..." : "Lưu Lịch Hẹn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
