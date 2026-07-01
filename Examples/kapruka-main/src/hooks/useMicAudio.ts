"use client";

import { useRef } from "react";

export function useMicAudio() {
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const vadHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function acquireMic(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;

    return stream;
  }

  function bindOutputTrack(pc: RTCPeerConnection) {
    pc.ontrack = (e) => {
      if (!audioRef.current) {
        audioRef.current = document.createElement("audio");
        audioRef.current.autoplay = true;
      }
      audioRef.current.srcObject = e.streams[0];
    };
  }

  function release() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    if (vadRafRef.current !== null) cancelAnimationFrame(vadRafRef.current);
    if (vadHoldRef.current !== null) clearTimeout(vadHoldRef.current);
  }

  return { acquireMic, bindOutputTrack, release, analyserRef, streamRef, vadRafRef, vadHoldRef };
}
