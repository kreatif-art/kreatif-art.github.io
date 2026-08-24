import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { ContentItem } from '@/types';

/** Snapshot of analyser output for visualizers (copy into your own buffers if retaining). */
export type AnalyserSnapshot = {
  /** 0–255 frequency bins (length = frequencyBinCount) */
  frequency: Uint8Array;
  /** 0–255 time-domain waveform */
  timeDomain: Uint8Array;
  /** 0–1 overall energy (RMS-ish of frequency data) */
  energy: number;
  /** 0–1 bass / mid / treble band averages */
  bass: number;
  mid: number;
  treble: number;
};

interface PlayerContextValue {
  currentTrack: ContentItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  /** Active queue (e.g. collection). Empty when playing a single track. */
  queue: ContentItem[];
  queueIndex: number;
  /** When true, end of queue restarts at first track */
  loopQueue: boolean;
  play: (track: ContentItem) => void;
  /** Play a list (collection); loops by default */
  playQueue: (tracks: ContentItem[], startIndex?: number, loop?: boolean) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  stop: () => void;
  setLoopQueue: (loop: boolean) => void;
  /**
   * Read latest analyser data. Safe to call every animation frame while playing.
   * Returns null if graph not ready or no track.
   */
  getAnalyserData: () => AnalyserSnapshot | null;
  /** Underlying AnalyserNode (advanced); prefer getAnalyserData for most UI. */
  analyserNode: AnalyserNode | null;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

const FFT_SIZE = 256;

function bandAvg(freq: Uint8Array, start: number, end: number): number {
  const hi = Math.min(end, freq.length);
  const lo = Math.min(start, hi);
  if (hi <= lo) return 0;
  let sum = 0;
  for (let i = lo; i < hi; i++) sum += freq[i];
  return sum / (hi - lo) / 255;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqBufRef = useRef<Uint8Array | null>(null);
  const timeBufRef = useRef<Uint8Array | null>(null);
  const graphReadyRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState<ContentItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [queue, setQueue] = useState<ContentItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [loopQueue, setLoopQueue] = useState(true);

  const queueRef = useRef<ContentItem[]>([]);
  const queueIndexRef = useRef(-1);
  const loopQueueRef = useRef(true);
  const playTrackRef = useRef<(track: ContentItem, opts?: { fromQueue?: boolean }) => Promise<void>>(async () => {});

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);
  useEffect(() => {
    loopQueueRef.current = loopQueue;
  }, [loopQueue]);

  const ensureGraph = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Resume / create AudioContext after a user gesture
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    const actx = ctxRef.current;
    if (actx.state === 'suspended') {
      try {
        await actx.resume();
      } catch {
        /* ignore */
      }
    }

    if (graphReadyRef.current && sourceRef.current) return;

    // MediaElementSource can only be created once per element
    try {
      const analyser = actx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.75;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -20;

      const source = actx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(actx.destination);

      sourceRef.current = source;
      analyserRef.current = analyser;
      freqBufRef.current = new Uint8Array(analyser.frequencyBinCount);
      timeBufRef.current = new Uint8Array(analyser.fftSize);
      graphReadyRef.current = true;
      setAnalyserNode(analyser);
    } catch (err) {
      // Already connected (HMR / strict mode double mount) — keep existing graph
      console.warn('Audio graph setup:', err);
      if (analyserRef.current) setAnalyserNode(analyserRef.current);
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.preload = 'metadata';
      audioRef.current.playsInline = true;
      (audioRef.current as HTMLAudioElement & { webkitPlaysInline?: boolean }).webkitPlaysInline = true;
      audioRef.current.volume = 0.8;
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      if (q.length === 0 || idx < 0) return;
      let next = idx + 1;
      if (next >= q.length) {
        if (loopQueueRef.current) next = 0;
        else return;
      }
      const track = q[next];
      if (track) {
        setQueueIndex(next);
        queueIndexRef.current = next;
        void playTrackRef.current(track, { fromQueue: true });
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const getAnalyserData = useCallback((): AnalyserSnapshot | null => {
    const analyser = analyserRef.current;
    const freqBuf = freqBufRef.current;
    const timeBuf = timeBufRef.current;
    if (!analyser || !freqBuf || !timeBuf) return null;

    analyser.getByteFrequencyData(freqBuf);
    analyser.getByteTimeDomainData(timeBuf);

    let sumSq = 0;
    for (let i = 0; i < freqBuf.length; i++) {
      const v = freqBuf[i] / 255;
      sumSq += v * v;
    }
    const energy = Math.sqrt(sumSq / freqBuf.length);

    const n = freqBuf.length;
    return {
      frequency: freqBuf,
      timeDomain: timeBuf,
      energy,
      bass: bandAvg(freqBuf, 0, Math.floor(n * 0.12)),
      mid: bandAvg(freqBuf, Math.floor(n * 0.12), Math.floor(n * 0.45)),
      treble: bandAvg(freqBuf, Math.floor(n * 0.45), n),
    };
  }, []);

  const playTrackInternal = useCallback(
    async (track: ContentItem, opts?: { fromQueue?: boolean }) => {
      const audio = audioRef.current;
      if (!audio) return;
      await ensureGraph();
      if (!opts?.fromQueue) {
        // Single-track play clears queue unless same id mid-queue
        setQueue([]);
        queueRef.current = [];
        setQueueIndex(-1);
        queueIndexRef.current = -1;
      }
      setCurrentTrack(track);
      audio.src = track.file_url;
      try {
        await audio.play();
      } catch (err) {
        console.error('Playback failed:', err);
      }
    },
    [ensureGraph],
  );

  useEffect(() => {
    playTrackRef.current = playTrackInternal;
  }, [playTrackInternal]);

  const play = useCallback(
    async (track: ContentItem) => {
      const audio = audioRef.current;
      if (!audio) return;
      await ensureGraph();
      if (currentTrack?.id === track.id) {
        if (audio.paused) {
          await audio.play().catch((err) => console.error('Playback failed:', err));
        }
        return;
      }
      await playTrackInternal(track, { fromQueue: false });
    },
    [currentTrack, ensureGraph, playTrackInternal],
  );

  const playQueue = useCallback(
    async (tracks: ContentItem[], startIndex = 0, loop = true) => {
      const music = tracks.filter((t) => t.type === 'music' && t.file_url);
      if (!music.length) return;
      const idx = Math.max(0, Math.min(startIndex, music.length - 1));
      setQueue(music);
      queueRef.current = music;
      setQueueIndex(idx);
      queueIndexRef.current = idx;
      setLoopQueue(loop);
      loopQueueRef.current = loop;
      await playTrackInternal(music[idx], { fromQueue: true });
    },
    [playTrackInternal],
  );

  const playNext = useCallback(async () => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (!q.length) return;
    let next = idx + 1;
    if (next >= q.length) {
      if (!loopQueueRef.current) return;
      next = 0;
    }
    setQueueIndex(next);
    queueIndexRef.current = next;
    await playTrackInternal(q[next], { fromQueue: true });
  }, [playTrackInternal]);

  const playPrev = useCallback(async () => {
    const audio = audioRef.current;
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (!q.length) return;
    let prev = idx - 1;
    if (prev < 0) {
      if (!loopQueueRef.current) {
        if (audio) {
          audio.currentTime = 0;
          setCurrentTime(0);
        }
        return;
      }
      prev = q.length - 1;
    }
    setQueueIndex(prev);
    queueIndexRef.current = prev;
    await playTrackInternal(q[prev], { fromQueue: true });
  }, [playTrackInternal]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    await ensureGraph();
    if (audio.paused) {
      await audio.play().catch((err) => console.error('Playback failed:', err));
    } else {
      audio.pause();
    }
  }, [currentTrack, ensureGraph]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    const v = Math.max(0, Math.min(1, vol));
    if (audio) audio.volume = v;
    setVolumeState(v);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQueue([]);
    queueRef.current = [];
    setQueueIndex(-1);
    queueIndexRef.current = -1;
  }, []);


  // Lock screen / OS media controls (mobile + desktop)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    const cover =
      currentTrack.type === 'art'
        ? currentTrack.file_url
        : currentTrack.cover_image_url || undefined;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.profiles?.display_name || 'Kreatif',
        album: 'Kreatif',
        artwork: cover
          ? [
              { src: cover, sizes: '512x512', type: 'image/jpeg' },
              { src: cover, sizes: '256x256', type: 'image/jpeg' },
            ]
          : [],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      /* MediaMetadata unsupported variants */
    }

    const audio = audioRef.current;
    const safe = (fn: () => void) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    };

    navigator.mediaSession.setActionHandler('play', () => {
      safe(() => {
        void audio?.play();
      });
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      safe(() => audio?.pause());
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      safe(() => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        setCurrentTrack(null);
        setIsPlaying(false);
      });
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null && audio) {
        audio.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      if (!audio) return;
      const off = details.seekOffset ?? 10;
      audio.currentTime = Math.max(0, audio.currentTime - off);
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      if (!audio) return;
      const off = details.seekOffset ?? 10;
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + off);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      if (!q.length) return;
      let next = idx + 1;
      if (next >= q.length) next = loopQueueRef.current ? 0 : idx;
      if (next !== idx && q[next]) {
        setQueueIndex(next);
        queueIndexRef.current = next;
        void playTrackRef.current(q[next], { fromQueue: true });
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
      if (!q.length) return;
      let prev = idx - 1;
      if (prev < 0) prev = loopQueueRef.current ? q.length - 1 : 0;
      if (q[prev]) {
        setQueueIndex(prev);
        queueIndexRef.current = prev;
        void playTrackRef.current(q[prev], { fromQueue: true });
      }
    });

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      } catch {
        /* ignore */
      }
    };
  }, [currentTrack, isPlaying]);

  // Keep position state in sync for scrubbers on lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    try {
      if (duration > 0 && Number.isFinite(currentTime)) {
        navigator.mediaSession.setPositionState({
          duration,
          position: Math.min(currentTime, duration),
          playbackRate: 1,
        });
      }
    } catch {
      /* setPositionState not supported */
    }
  }, [currentTrack, currentTime, duration]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        queueIndex,
        loopQueue,
        play,
        playQueue,
        playNext,
        playPrev,
        togglePlay,
        seek,
        setVolume,
        stop,
        setLoopQueue,
        getAnalyserData,
        analyserNode,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
