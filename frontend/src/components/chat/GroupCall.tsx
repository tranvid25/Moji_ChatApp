/**
 * GroupCall.tsx
 *
 * Giao diện cuộc gọi nhóm (LiveKit).
 * Hiển thị grid video cho tất cả participant trong room.
 */

import { useEffect, useState } from "react";
import { RoomEvent, Participant } from "livekit-client";
import { 
  Mic, 
  MicOff, 
  Video, 
  PhoneOff, 
  Users
} from "lucide-react";
import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { useGroupCall } from "@/hooks/useGroupCall";
import ParticipantTile from "./ParticipantTile";
import { cn } from "@/lib/utils";

const GroupCall = () => {
  const {
    status,
    room,
    groupName,
    isIncoming,
    callerName,
    callerAvatar,
    isMicMuted,
    isCameraOff,
  } = useGroupCallStore();

  const { joinCall, leaveCall, rejectCall, toggleMic, toggleCamera } = useGroupCall();
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Đăng ký nhận sự kiện thay đổi danh sách tham gia
  useEffect(() => {
    if (!room) return;

    const updateParticipants = () => {
      setParticipants(Array.from(room.remoteParticipants.values()));
    };

    room.on(RoomEvent.ParticipantConnected, updateParticipants);
    room.on(RoomEvent.ParticipantDisconnected, updateParticipants);
    room.on(RoomEvent.TrackSubscribed, updateParticipants);
    room.on(RoomEvent.TrackUnsubscribed, updateParticipants);
    room.on(RoomEvent.ActiveSpeakersChanged, updateParticipants);

    // Khởi tạo danh sách ban đầu
    setParticipants(Array.from(room.remoteParticipants.values()));

    return () => {
      room.off(RoomEvent.ParticipantConnected, updateParticipants);
      room.off(RoomEvent.ParticipantDisconnected, updateParticipants);
      room.off(RoomEvent.TrackSubscribed, updateParticipants);
      room.off(RoomEvent.TrackUnsubscribed, updateParticipants);
      room.off(RoomEvent.ActiveSpeakersChanged, updateParticipants);
    };
  }, [room]);

  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* --- Overlay: Incoming Call --- */}
      {status === "ringing" && isIncoming && (
        <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300 max-w-sm w-full mx-auto px-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/30 shadow-2xl">
              {callerAvatar ? (
                <img src={callerAvatar} alt={callerName ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white text-3xl font-bold">
                  {callerName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
          </div>

          <div className="text-center text-white">
            <h3 className="text-xl font-bold">{groupName || "Cuộc gọi nhóm"}</h3>
            <p className="text-white/70 mt-1">{callerName} đang mời bạn tham gia...</p>
          </div>

          <div className="flex items-center gap-8 w-full justify-center">
            <button
              onClick={rejectCall}
              className="flex flex-col items-center gap-2 group transition-smooth"
            >
              <div className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 text-white">
                <PhoneOff className="size-6" />
              </div>
              <span className="text-xs text-white/70">Từ chối</span>
            </button>

            <button
              onClick={joinCall}
              className="flex flex-col items-center gap-2 group transition-smooth"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 text-white">
                <Video className="size-6" />
              </div>
              <span className="text-xs text-white/70">Tham gia</span>
            </button>
          </div>
        </div>
      )}

      {/* --- Overlay: Joining / Calling --- */}
      {(status === "joining" || status === "calling") && (
        <div className="relative z-10 flex flex-col items-center gap-6 text-white animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <div className="text-center">
            <h3 className="text-xl font-medium">{groupName}</h3>
            <p className="text-white/60 mt-1">
              {status === "joining" ? "Đang kết nối..." : "Đang chờ mọi người tham gia..."}
            </p>
          </div>
          {/* Always show cancel button if we are initiating/joining */}
          <button
            onClick={leaveCall}
            className="mt-4 px-8 py-3 rounded-xl bg-destructive hover:bg-destructive/80 transition-smooth text-sm font-medium shadow-lg"
          >
            {status === "joining" ? "Hủy kết nối" : "Hủy cuộc gọi"}
          </button>
        </div>
      )}

      {/* --- Main UI: In-Call Video Grid --- */}
      {status === "in-call" && room && (
        <div className="relative z-10 w-full h-[100dvh] flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{groupName}</h3>
                <p className="text-xs text-white/50">{participants.length + 1} người tham gia</p>
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <div className={cn(
            "flex-1 grid gap-4 w-full max-w-6xl mx-auto min-h-0 pb-24", // pb-24 to avoid overlapping with controls
            participants.length === 0 ? "grid-cols-1" :
            participants.length === 1 ? "grid-cols-1 sm:grid-cols-2" :
            participants.length === 2 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
            "grid-cols-2 lg:grid-cols-3"
          )}>
            {/* Local Participant (You) */}
            <div className="w-full h-full min-h-0">
               <ParticipantTile participant={room.localParticipant} />
            </div>

            {/* Remote Participants */}
            {participants.map((p) => (
              <div key={p.identity} className="w-full h-full min-h-0">
                <ParticipantTile participant={p} />
              </div>
            ))}
          </div>

          {/* Controls Bar - Fixed at bottom */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 py-3 px-6 rounded-3xl bg-gray-900/90 backdrop-blur-xl border border-white/10 w-fit shadow-2xl z-50">
            <button
              onClick={toggleMic}
              className={cn(
                "p-4 rounded-full transition-smooth group relative shadow-md hover:-translate-y-1",
                isMicMuted ? "bg-destructive text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isMicMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-smooth whitespace-nowrap">
                {isMicMuted ? "Bật Mic" : "Tắt Mic"}
              </span>
            </button>

            <button
              onClick={toggleCamera}
              className={cn(
                "p-4 rounded-full transition-smooth group relative shadow-md hover:-translate-y-1",
                isCameraOff ? "bg-destructive text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isCameraOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-smooth whitespace-nowrap">
                {isCameraOff ? "Bật Camera" : "Tắt Camera"}
              </span>
            </button>

            <button
              onClick={leaveCall}
              className="p-4 rounded-full bg-destructive hover:bg-destructive/80 text-white transition-smooth shadow-lg hover:-translate-y-1 active:scale-95 group relative ml-4"
            >
              <PhoneOff className="size-6" />
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-smooth whitespace-nowrap">
                Rời cuộc gọi
              </span>
            </button>
          </div>
        </div>
      )}

      {/* --- Overlay: Call Ended --- */}
      {status === "ended" && (
        <div className="relative z-10 flex flex-col items-center gap-4 text-white animate-in fade-in duration-500">
           <div className="w-20 h-20 rounded-full bg-destructive/20 border border-destructive/20 flex items-center justify-center mb-2">
              <PhoneOff className="size-10 text-destructive" />
           </div>
           <h3 className="text-xl font-medium">Cuộc gọi đã kết thúc</h3>
           <p className="text-white/50">Cảm ơn bạn đã sử dụng TVChat Group Call</p>
        </div>
      )}
    </div>
  );
};

export default GroupCall;
