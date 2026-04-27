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

// ─── Helper: release all active camera/mic tracks ─────────────────────────────
// Prevents NotReadableError when LiveKit tries to acquire the device right
// after a 1-on-1 WebRTC call that may not have fully released hardware yet.

async function stopAllActiveTracks(): Promise<void> {
  // Synchronously stop any tracks still held by useVideoCallStore
  const { useVideoCallStore } = await import("@/stores/useVideoCallStore");
  const { localStream, peerConnection } = useVideoCallStore.getState();

  if (localStream) {
    localStream.getTracks().forEach((t) => {
      t.stop();
      console.log("[GroupCall] Released stale track:", t.kind, t.label);
    });
    // Null it out immediately so nothing else tries to use it
    useVideoCallStore.setState({ localStream: null });
  }

  if (peerConnection && peerConnection.signalingState !== "closed") {
    peerConnection.close();
    useVideoCallStore.setState({ peerConnection: null });
  }

  // Give the OS ~100ms to fully release the hardware handle
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGroupCall() {
  // ── Core: connect tới LiveKit room ─────────────────────────────────────────

  const connectToRoom = useCallback(
    async (token: string, livekitUrl: string) => {
      const { setRoom, setStatus, reset } = useGroupCallStore.getState();

      // Guard: prevent duplicate room creation
      const existing = useGroupCallStore.getState().room;
      if (existing) {
        console.warn("[GroupCall] Room already exists, skipping re-connect");
        return;
      }

      // ── Defensive: release any stale media tracks from 1-on-1 WebRTC calls ──
      // Browsers throw NotReadableError if another stream is still holding the
      // camera/mic device handle. Stop everything before LiveKit acquires it.
      await stopAllActiveTracks();

      const room = new Room(ROOM_OPTIONS);
      setRoom(room);
      setStatus("joining");

      // Handle room-level disconnect (network loss, server restart, etc.)
      const onDisconnected = () => {
        console.log("[GroupCall] Room disconnected");
        reset();
      };
      room.on(RoomEvent.Disconnected, onDisconnected);

      try {
        await room.connect(livekitUrl, token);

        // Enable camera + mic after connect
        await room.localParticipant.enableCameraAndMicrophone();

        setStatus("in-call");
      } catch (err) {
        console.error("[GroupCall] Không thể kết nối LiveKit:", err);
        room.off(RoomEvent.Disconnected, onDisconnected);
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

      // Guard: prevent double-start
      if (useGroupCallStore.getState().status !== "idle") return;

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

        // 5. Thông báo đã join (backend sẽ track + notify others)
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
    const { conversationId, status } = useGroupCallStore.getState();
    const { socket } = useSocketStore.getState();

    if (!conversationId) return;

    // Guard: prevent double-join
    if (status !== "ringing") return;

    try {
      const { token, url } = await groupCallService.getToken(conversationId);
      await connectToRoom(token, url);

      // Thông báo mình đã join (backend tracks + notifies others)
      socket?.emit("join-group-call", { conversationId });
    } catch (err) {
      console.error("[GroupCall] joinCall failed:", err);
      useGroupCallStore.getState().reset();
      throw err;
    }
  }, [connectToRoom]);

  // ── Leave / End Call ──────────────────────────────────────────────────────

  const leaveCall = useCallback(async () => {
    const { conversationId, isInitiator, endCall } = useGroupCallStore.getState();
    const { socket } = useSocketStore.getState();

    if (conversationId) {
      if (isInitiator) {
        // Initiator: end the call for ALL participants
        socket?.emit("end-group-call", { conversationId });
      } else {
        // Regular participant: just leave, others stay
        socket?.emit("leave-group-call", { conversationId });
      }
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
