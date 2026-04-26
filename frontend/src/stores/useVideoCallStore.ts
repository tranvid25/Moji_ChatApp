import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "in-call"
  | "ended";

export interface VideoCallState {
  // Core state
  status: CallStatus;
  conversationId: string | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  remoteUserAvatar: string | null;
  isIncoming: boolean;

  // Media state
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicMuted: boolean;
  isCameraOff: boolean;

  // WebRTC
  peerConnection: RTCPeerConnection | null;

  // Call duration
  callStartedAt: number | null;

  // Actions
  initiateCall: (params: {
    conversationId: string;
    remoteUserId: string;
    remoteUserName: string;
    remoteUserAvatar?: string | null;
  }) => void;
  receiveCall: (params: {
    conversationId: string;
    remoteUserId: string;
    remoteUserName: string;
    remoteUserAvatar?: string | null;
  }) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setStatus: (status: CallStatus) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  endCall: () => void;
  reset: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  status: "idle" as CallStatus,
  conversationId: null,
  remoteUserId: null,
  remoteUserName: null,
  remoteUserAvatar: null,
  isIncoming: false,
  localStream: null,
  remoteStream: null,
  isMicMuted: false,
  isCameraOff: false,
  peerConnection: null,
  callStartedAt: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  ...INITIAL_STATE,

  initiateCall: ({ conversationId, remoteUserId, remoteUserName, remoteUserAvatar }) => {
    set({
      status: "calling",
      conversationId,
      remoteUserId,
      remoteUserName,
      remoteUserAvatar: remoteUserAvatar ?? null,
      isIncoming: false,
    });
  },

  receiveCall: ({ conversationId, remoteUserId, remoteUserName, remoteUserAvatar }) => {
    set({
      status: "ringing",
      conversationId,
      remoteUserId,
      remoteUserName,
      remoteUserAvatar: remoteUserAvatar ?? null,
      isIncoming: true,
    });
  },

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),

  setStatus: (status) => {
    const update: Partial<VideoCallState> = { status };
    if (status === "in-call") {
      update.callStartedAt = Date.now();
    }
    set(update);
  },

  toggleMic: () => {
    const { localStream, isMicMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMicMuted; // toggling: if muted, re-enable
      });
    }
    set({ isMicMuted: !isMicMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff; // toggling
      });
    }
    set({ isCameraOff: !isCameraOff });
  },

  endCall: () => {
    const { localStream, peerConnection } = get();

    // Stop all local media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.close();
    }

    set({ status: "ended" });

    // Auto-reset after animation
    setTimeout(() => {
      get().reset();
    }, 2000);
  },

  reset: () => {
    const { localStream, peerConnection } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    set(INITIAL_STATE);
  },
}));
