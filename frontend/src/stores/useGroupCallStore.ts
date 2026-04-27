/**
 * useGroupCallStore.ts
 *
 * Zustand store quản lý trạng thái Group Video Call (LiveKit).
 *
 * KHÔNG store serializable state của Room (nó là class phức tạp).
 * Chỉ store Room reference + metadata + media flags.
 */

import { create } from "zustand";
import type { Room } from "livekit-client";

export type GroupCallStatus =
  | "idle"
  | "calling"    // mình đang gọi, chờ người khác pick up
  | "ringing"    // có incoming call, chờ mình accept/reject
  | "joining"    // đang connect tới LiveKit
  | "in-call"    // đang trong call
  | "ended";     // call vừa kết thúc (hiện overlay rồi reset)

export interface GroupCallState {
  // --- Core metadata ---
  status: GroupCallStatus;
  conversationId: string | null;
  groupName: string | null;
  isIncoming: boolean;
  isInitiator: boolean;   // true = this user started the call
  callerName: string | null;
  callerAvatar: string | null;
  callerId: string | null;

  // --- LiveKit Room (mutable, không serialize) ---
  room: Room | null;

  // --- Local media state ---
  isMicMuted: boolean;
  isCameraOff: boolean;

  // --- Actions ---
  setStatus: (status: GroupCallStatus) => void;
  setRoom: (room: Room | null) => void;
  setMicMuted: (v: boolean) => void;
  setCameraOff: (v: boolean) => void;

  initiateCall: (params: {
    conversationId: string;
    groupName: string;
  }) => void;

  receiveCall: (params: {
    conversationId: string;
    groupName: string;
    callerName: string;
    callerAvatar?: string | null;
    callerId: string;
  }) => void;

  endCall: () => void;
  reset: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const INITIAL: Omit<
  GroupCallState,
  | "setStatus"
  | "setRoom"
  | "setMicMuted"
  | "setCameraOff"
  | "initiateCall"
  | "receiveCall"
  | "endCall"
  | "reset"
> = {
  status: "idle",
  conversationId: null,
  groupName: null,
  isIncoming: false,
  isInitiator: false,
  callerName: null,
  callerAvatar: null,
  callerId: null,
  room: null,
  isMicMuted: false,
  isCameraOff: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGroupCallStore = create<GroupCallState>((set, get) => ({
  ...INITIAL,

  setStatus: (status) => set({ status }),
  setRoom: (room) => set({ room }),
  setMicMuted: (v) => set({ isMicMuted: v }),
  setCameraOff: (v) => set({ isCameraOff: v }),

  initiateCall: ({ conversationId, groupName }) =>
    set({
      status: "calling",
      conversationId,
      groupName,
      isIncoming: false,
      isInitiator: true,
      callerName: null,
      callerAvatar: null,
      callerId: null,
    }),

  receiveCall: ({ conversationId, groupName, callerName, callerAvatar, callerId }) =>
    set({
      status: "ringing",
      conversationId,
      groupName,
      isIncoming: true,
      isInitiator: false,
      callerName,
      callerAvatar: callerAvatar ?? null,
      callerId,
    }),

  endCall: () => {
    const { room } = get();
    if (room) {
      room.disconnect().catch(() => {});
    }
    set({ status: "ended" });
    // Auto-reset after show "ended" overlay
    setTimeout(() => get().reset(), 2500);
  },

  reset: () => {
    const { room } = get();
    if (room) {
      room.disconnect().catch(() => {});
    }
    set({ ...INITIAL });
  },
}));
