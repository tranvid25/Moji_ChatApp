/**
 * useWebRTC – Hook quản lý toàn bộ WebRTC logic cho video call 1-1.
 *
 * Responsibilities:
 *  - Tạo / destroy RTCPeerConnection
 *  - Lấy local media stream (camera + mic)
 *  - Gửi offer / answer / ICE candidates qua Socket.IO
 *  - Nhận và xử lý remote stream
 *  - Cleanup khi call kết thúc
 *
 * NOTE: peerConnection is stored in useVideoCallStore (not a local ref)
 * so all hook instances across different components share the same PC.
 */

import { useCallback } from "react";
import { useSocketStore } from "@/stores/useSocketStore";
import { useVideoCallStore } from "@/stores/useVideoCallStore";

// Google STUN servers – no authentication required
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC() {
  // ─── 1. Get user media ──────────────────────────────────────────────────────

  const getUserMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (err: unknown) {
      const errorName = (err as DOMException)?.name;
      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError"
      ) {
        console.warn("[WebRTC] Người dùng từ chối quyền camera/mic");
      } else {
        console.error("[WebRTC] Lỗi lấy media:", err);
      }
      return null;
    }
  }, []);

  // ─── 2. Create PeerConnection ───────────────────────────────────────────────

  const createPeerConnection = useCallback(
    (stream: MediaStream): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Receive remote tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          useVideoCallStore.getState().setRemoteStream(remoteStream);
        }
      };

      // Forward ICE candidates to remote peer via signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const { socket: s } = useSocketStore.getState();
          const { remoteUserId: rid } = useVideoCallStore.getState();
          s?.emit("ice-candidate", {
            to: rid,
            candidate: event.candidate,
          });
        }
      };

      // Reflect connection state changes
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log("[WebRTC] ICE connection state:", state);
        if (state === "connected" || state === "completed") {
          useVideoCallStore.getState().setStatus("in-call");
        } else if (
          state === "disconnected" ||
          state === "failed" ||
          state === "closed"
        ) {
          useVideoCallStore.getState().endCall();
        }
      };

      // Save PC in shared store so all hook instances can access it
      useVideoCallStore.getState().setPeerConnection(pc);
      return pc;
    },
    [],
  );

  // ─── 3. Start Call (Caller side) ───────────────────────────────────────────

  const startCall = useCallback(async () => {
    const stream = await getUserMedia();
    if (!stream) return;

    useVideoCallStore.getState().setLocalStream(stream);

    const { conversationId: cid, remoteUserId: rid } =
      useVideoCallStore.getState();
    const { socket: s } = useSocketStore.getState();

    const pc = createPeerConnection(stream);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    s?.emit("call-user", {
      to: rid,
      conversationId: cid,
      offer,
    });
  }, [getUserMedia, createPeerConnection]);

  // ─── 4. Accept Call (Callee side) ──────────────────────────────────────────

  const acceptCall = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const stream = await getUserMedia();
      if (!stream) return;

      useVideoCallStore.getState().setLocalStream(stream);

      const { remoteUserId: rid, conversationId: cid } =
        useVideoCallStore.getState();
      const { socket: s } = useSocketStore.getState();

      const pc = createPeerConnection(stream);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      s?.emit("answer-call", {
        to: rid,
        conversationId: cid,
        answer,
      });

      useVideoCallStore.getState().setStatus("in-call");
    },
    [getUserMedia, createPeerConnection],
  );

  // ─── 5. Reject Call ────────────────────────────────────────────────────────

  const rejectCall = useCallback(() => {
    const { remoteUserId: rid, conversationId: cid } =
      useVideoCallStore.getState();
    const { socket: s } = useSocketStore.getState();

    s?.emit("end-call", { to: rid, conversationId: cid, reason: "rejected" });
    useVideoCallStore.getState().endCall();
  }, []);

  // ─── 6. Hang Up ────────────────────────────────────────────────────────────

  const hangUp = useCallback(() => {
    const { remoteUserId: rid, conversationId: cid } =
      useVideoCallStore.getState();
    const { socket: s } = useSocketStore.getState();

    s?.emit("end-call", { to: rid, conversationId: cid, reason: "ended" });
    useVideoCallStore.getState().endCall();
  }, []);

  return {
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
  };
}
