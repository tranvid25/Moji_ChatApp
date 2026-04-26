/**
 * ParticipantTile.tsx
 *
 * Render video + audio cho 1 participant (local hoặc remote).
 * Tự subscribe vào track events của participant để cập nhật UI.
 */

import { useEffect, useRef, useState } from "react";
import {
  Participant,
  LocalParticipant,
  ParticipantEvent,
  Track,
} from "livekit-client";
import type { TrackPublication } from "livekit-client";
import { Mic, MicOff, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantTileProps {
  participant: Participant;
  /** Nếu true, tile này sẽ nhỏ hơn (dành cho local preview nhỏ) */
  isSmall?: boolean;
}

const ParticipantTile = ({ participant, isSmall = false }: ParticipantTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [hasVideo, setHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isLocal = participant instanceof LocalParticipant;

  // ── Attach / detach tracks khi có thay đổi ─────────────────────────────────
  useEffect(() => {
    const attachVideo = () => {
      const pub = participant.getTrackPublication(Track.Source.Camera);
      const track = pub?.track;
      if (track && videoRef.current) {
        track.attach(videoRef.current);
        setHasVideo(!pub?.isMuted);
      } else {
        setHasVideo(false);
      }
    };

    const attachAudio = () => {
      if (isLocal) return; // không play audio của chính mình
      const pub = participant.getTrackPublication(Track.Source.Microphone);
      const track = pub?.track;
      if (track && audioRef.current) {
        track.attach(audioRef.current);
      }
      setIsMuted(pub?.isMuted ?? false);
    };

    const handleTrackEvent = (pub: TrackPublication) => {
      if (pub.source === Track.Source.Camera) attachVideo();
      if (pub.source === Track.Source.Microphone) attachAudio();
    };

    const handleMuteChanged = (pub: TrackPublication) => {
      if (pub.source === Track.Source.Camera) setHasVideo(!pub.isMuted);
      if (pub.source === Track.Source.Microphone) setIsMuted(pub.isMuted);
    };

    // Initial attach
    attachVideo();
    attachAudio();

    participant.on(ParticipantEvent.TrackSubscribed, handleTrackEvent);
    participant.on(ParticipantEvent.TrackUnsubscribed, handleTrackEvent);
    participant.on(ParticipantEvent.LocalTrackPublished, handleTrackEvent);
    participant.on(ParticipantEvent.LocalTrackUnpublished, handleTrackEvent);
    participant.on(ParticipantEvent.TrackMuted, handleMuteChanged);
    participant.on(ParticipantEvent.TrackUnmuted, handleMuteChanged);

    return () => {
      // Detach video
      const videoPub = participant.getTrackPublication(Track.Source.Camera);
      if (videoPub?.track && videoRef.current) {
        videoPub.track.detach(videoRef.current);
      }
      // Detach audio
      if (!isLocal) {
        const audioPub = participant.getTrackPublication(Track.Source.Microphone);
        if (audioPub?.track && audioRef.current) {
          audioPub.track.detach(audioRef.current);
        }
      }

      participant.off(ParticipantEvent.TrackSubscribed, handleTrackEvent);
      participant.off(ParticipantEvent.TrackUnsubscribed, handleTrackEvent);
      participant.off(ParticipantEvent.LocalTrackPublished, handleTrackEvent);
      participant.off(ParticipantEvent.LocalTrackUnpublished, handleTrackEvent);
      participant.off(ParticipantEvent.TrackMuted, handleMuteChanged);
      participant.off(ParticipantEvent.TrackUnmuted, handleMuteChanged);
    };
  }, [participant, isLocal]);

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center",
        isSmall ? "w-full h-full" : "w-full h-full",
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // không tự nghe audio của mình
        className={cn(
          "w-full h-full object-cover",
          !hasVideo && "hidden",
        )}
      />

      {/* Audio element (cho remote participants) */}
      {!isLocal && <audio ref={audioRef} autoPlay />}

      {/* Fallback avatar khi camera off */}
      {!hasVideo && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {(participant.name ?? participant.identity)?.[0]?.toUpperCase() ?? "?"}
          </div>
          <VideoOff className="size-4 text-white/40 mt-1" />
        </div>
      )}

      {/* Name badge + mic indicator */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-xs text-white font-medium bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[80%]">
          {participant.name ?? participant.identity}
          {isLocal && " (Bạn)"}
        </span>
        {isMuted && (
          <div className="bg-red-500/80 rounded-full p-1">
            <MicOff className="size-3 text-white" />
          </div>
        )}
        {!isMuted && (
          <div className="bg-black/40 rounded-full p-1">
            <Mic className="size-3 text-white/70" />
          </div>
        )}
      </div>

      {/* "You" border highlight */}
      {isLocal && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-violet-500/60 pointer-events-none" />
      )}
    </div>
  );
};

export default ParticipantTile;
