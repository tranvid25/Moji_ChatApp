/**
 * VideoCall.tsx
 *
 * Popup video call UI giống Facebook Messenger:
 *  - Idle / Calling / Ringing / In-Call / Ended states
 *  - Local video preview (small, corner)
 *  - Remote video (main display)
 *  - Controls: Mic, Camera, End call
 *  - Incoming call overlay with Accept/Reject
 */

import { useEffect, useRef, useState } from "react";
import { useVideoCallStore } from "@/stores/useVideoCallStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  PhoneIncoming,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helper: format elapsed seconds ──────────────────────────────────────────
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── VideoCall Component ──────────────────────────────────────────────────────

const VideoCall = () => {
  const {
    status,
    remoteUserName,
    remoteUserAvatar,
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isIncoming,
    callStartedAt,
    toggleMic,
    toggleCamera,
  } = useVideoCallStore();

  const { acceptCall, rejectCall, hangUp } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [elapsed, setElapsed] = useState(0);

  // ── Attach local stream to video element ───────────────────────────────────
  // NOTE: status is intentionally included so this re-runs when the in-call
  // UI mounts for the first time (the <video> elements only appear at that point,
  // but localStream was already set earlier during the "calling" phase).
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  // ── Attach remote stream to video element ──────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, status]);

  // ── Call duration timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "in-call" || !callStartedAt) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - callStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, callStartedAt]);

  // Reset timer between calls
  useEffect(() => {
    if (status === "idle") setElapsed(0);
  }, [status]);

  // ── Not visible when idle ──────────────────────────────────────────────────
  if (status === "idle") return null;

  // ─── Shared Overlay wrapper ────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-label="Video Call"
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* ── INCOMING CALL overlay ─────────────────────────────────────────── */}
      {status === "ringing" && isIncoming && (
        <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/30 shadow-2xl">
              {remoteUserAvatar ? (
                <img
                  src={remoteUserAvatar}
                  alt={remoteUserName ?? "Caller"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                  {remoteUserName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            {/* Pulsing ring animation */}
            <span className="absolute inset-0 rounded-full animate-ping bg-white/20" />
          </div>

          <div className="text-center text-white space-y-1">
            <p className="text-xl font-semibold">{remoteUserName}</p>
            <p className="text-sm text-white/70 flex items-center gap-1.5">
              <PhoneIncoming className="size-3.5" />
              Đang gọi video…
            </p>
          </div>

          {/* Accept / Reject buttons */}
          <div className="flex items-center gap-8 mt-2">
            <button
              id="btn-reject-call"
              onClick={rejectCall}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110">
                <PhoneOff className="size-7 text-white" />
              </span>
              <span className="text-xs text-white/70">Từ chối</span>
            </button>

            <button
              id="btn-accept-call"
              onClick={() => {
                // The offer is stored in the store when the incoming-call event fires;
                // useSocketStore passes it through acceptCall via the stored offer ref.
                const offer = (window as unknown as Record<string, unknown>).__pendingOffer as RTCSessionDescriptionInit | undefined;
                if (offer) acceptCall(offer);
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110">
                <Phone className="size-7 text-white" />
              </span>
              <span className="text-xs text-white/70">Chấp nhận</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CALLING overlay (waiting for answer) ──────────────────────────── */}
      {status === "calling" && (
        <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/30 shadow-2xl">
              {remoteUserAvatar ? (
                <img
                  src={remoteUserAvatar}
                  alt={remoteUserName ?? ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                  {remoteUserName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <span className="absolute inset-0 rounded-full animate-ping bg-white/20" />
          </div>

          <div className="text-center text-white space-y-1">
            <p className="text-xl font-semibold">{remoteUserName}</p>
            <p className="text-sm text-white/70">Đang gọi…</p>
          </div>

          <button
            id="btn-cancel-call"
            onClick={hangUp}
            className="flex flex-col items-center gap-2 group mt-4"
          >
            <span className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110">
              <PhoneOff className="size-7 text-white" />
            </span>
            <span className="text-xs text-white/70">Huỷ</span>
          </button>
        </div>
      )}

      {/* ── IN-CALL video UI ─────────────────────────────────────────────── */}
      {status === "in-call" && (
        <div className="relative z-10 w-full max-w-2xl h-[480px] sm:h-[520px] mx-4 rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
          {/* Remote (main) video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Fallback when remote video not yet received */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/20">
                {remoteUserAvatar ? (
                  <img
                    src={remoteUserAvatar}
                    alt={remoteUserName ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                    {remoteUserName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <p className="text-sm text-white/70">Đang kết nối…</p>
            </div>
          )}

          {/* Call duration badge */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-mono backdrop-blur-sm">
            {formatDuration(elapsed)}
          </div>

          {/* Remote user name */}
          <div className="absolute top-4 left-4 text-white text-sm font-medium drop-shadow-md">
            {remoteUserName}
          </div>

          {/* Local preview (PiP – bottom right) */}
          <div className="absolute bottom-24 right-4 w-28 h-36 sm:w-32 sm:h-44 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-gray-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn("w-full h-full object-cover", isCameraOff && "hidden")}
            />
            {isCameraOff && (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <VideoOff className="size-8 text-white/50" />
              </div>
            )}
          </div>

          {/* Control bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 py-5 px-6 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm">
            {/* Mute mic */}
            <button
              id="btn-toggle-mic"
              onClick={toggleMic}
              title={isMicMuted ? "Bật mic" : "Tắt mic"}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95",
                isMicMuted
                  ? "bg-red-500 hover:bg-red-400"
                  : "bg-white/20 hover:bg-white/30",
              )}
            >
              {isMicMuted ? (
                <MicOff className="size-5 text-white" />
              ) : (
                <Mic className="size-5 text-white" />
              )}
            </button>

            {/* End call */}
            <button
              id="btn-end-call"
              onClick={hangUp}
              title="Kết thúc cuộc gọi"
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <PhoneOff className="size-6 text-white" />
            </button>

            {/* Toggle camera */}
            <button
              id="btn-toggle-camera"
              onClick={toggleCamera}
              title={isCameraOff ? "Bật camera" : "Tắt camera"}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95",
                isCameraOff
                  ? "bg-red-500 hover:bg-red-400"
                  : "bg-white/20 hover:bg-white/30",
              )}
            >
              {isCameraOff ? (
                <VideoOff className="size-5 text-white" />
              ) : (
                <Video className="size-5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── ENDED overlay ─────────────────────────────────────────────────── */}
      {status === "ended" && (
        <div className="relative z-10 flex flex-col items-center gap-4 text-white animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <PhoneOff className="size-9 text-red-400" />
          </div>
          <p className="text-lg font-medium">Cuộc gọi đã kết thúc</p>
          <p className="text-sm text-white/60">
            {elapsed > 0 ? formatDuration(elapsed) : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
