/**
 * useGroupCall.ts
 *
 * Hook encapsulating tất cả LiveKit logic:
 *  - Connect / disconnect Room
 *  - Publish camera + mic
 *  - Toggle mic / camera
 *  - Notify others qua Socket.IO
 */

import { useCallback } from "react";
import {
  Room,
  RoomEvent,
  VideoPresets,
} from "livekit-client";
import type { RoomOptions } from "livekit-client";
import { useGroupCallStore } from "@/stores/useGroupCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { groupCallService } from "@/services/groupCallService";

// ─── LiveKit Room defaults ────────────────────────────────────────────────────

const ROOM_OPTIONS: RoomOptions = {
  // Adaptive bitrate – tự điều chỉnh bandwidth
  adaptiveStream: true,
  // Dynacast – chỉ publish resolution cần thiết
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h360.resolution, // 640x360 cho nhóm
  },
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGroupCall() {
  // ── Core: connect tới LiveKit room ─────────────────────────────────────────

  const connectToRoom = useCallback(
    async (token: string, livekitUrl: string) => {
      const { setRoom, setStatus, reset } = useGroupCallStore.getState();

      const room = new Room(ROOM_OPTIONS);
      setRoom(room);
      setStatus("joining");

      // Handle room-level disconnect (network loss, server restart, etc.)
      room.on(RoomEvent.Disconnected, () => {
        console.log("[GroupCall] Room disconnected");
        reset();
      });

      try {
        await room.connect(livekitUrl, token);

        // Enable camera + mic after connect
        await room.localParticipant.enableCameraAndMicrophone();

        setStatus("in-call");
      } catch (err) {
        console.error("[GroupCall] Không thể kết nối LiveKit:", err);
        await room.disconnect();
        reset();
        throw err;
      }
    },
    [],
  );

  // ── Start Call (người khởi tạo) ──────────────────────────────────────────

  const startCall = useCallback(
    async ({
      conversationId,
      groupName,
      participantIds,
    }: {
      conversationId: string;
      groupName: string;
      participantIds: string[];
    }) => {
      const { initiateCall } = useGroupCallStore.getState();
      const { socket } = useSocketStore.getState();

      // 1. Update local state
      initiateCall({ conversationId, groupName });

      try {
        // 2. Lấy LiveKit token từ backend
        const { token, url } = await groupCallService.getToken(conversationId);

        // 3. Notify tất cả thành viên trong conversation với participantIds cụ thể
        socket?.emit("start-group-call", { 
          conversationId, 
          groupName, 
          participantIds 
        });

        // 4. Connect tới LiveKit
        await connectToRoom(token, url);

        // 5. Thông báo đã join (để UI người khác cập nhật)
        socket?.emit("join-group-call", { conversationId });
      } catch (err) {
        console.error("[GroupCall] startCall failed:", err);
        useGroupCallStore.getState().reset();
        throw err;
      }
    },
    [connectToRoom],
  );

  // ── Join Call (người được mời) ───────────────────────────────────────────

  const joinCall = useCallback(async () => {
    const { conversationId } = useGroupCallStore.getState();
    const { socket } = useSocketStore.getState();

    if (!conversationId) return;

    try {
      const { token, url } = await groupCallService.getToken(conversationId);
      await connectToRoom(token, url);

      // Thông báo mình đã join
      socket?.emit("join-group-call", { conversationId });
    } catch (err) {
      console.error("[GroupCall] joinCall failed:", err);
      useGroupCallStore.getState().reset();
      throw err;
    }
  }, [connectToRoom]);

  // ── Leave / End Call ──────────────────────────────────────────────────────

  const leaveCall = useCallback(async () => {
    const { conversationId, endCall } = useGroupCallStore.getState();
    const { socket } = useSocketStore.getState();

    if (conversationId) {
      socket?.emit("leave-group-call", { conversationId });
    }

    endCall();
  }, []);

  // ── Reject incoming call ──────────────────────────────────────────────────

  const rejectCall = useCallback(() => {
    const { conversationId, callerId, reset } = useGroupCallStore.getState();
    const { socket } = useSocketStore.getState();

    if (conversationId && callerId) {
      socket?.emit("reject-group-call", { conversationId, callerId });
    }

    reset();
  }, []);

  // ── Toggle Mic ────────────────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    const { room, isMicMuted, setMicMuted } = useGroupCallStore.getState();
    if (!room) return;
    const next = !isMicMuted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMicMuted(next);
  }, []);

  // ── Toggle Camera ─────────────────────────────────────────────────────────

  const toggleCamera = useCallback(async () => {
    const { room, isCameraOff, setCameraOff } = useGroupCallStore.getState();
    if (!room) return;
    const next = !isCameraOff;
    await room.localParticipant.setCameraEnabled(!next);
    setCameraOff(next);
  }, []);

  return {
    startCall,
    joinCall,
    leaveCall,
    rejectCall,
    toggleMic,
    toggleCamera,
  };
}
