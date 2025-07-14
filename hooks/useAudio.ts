import { useRef, useCallback, useState, useEffect } from "react";
import { BackgroundMusicType } from "../types";

const isBrowser = typeof window !== "undefined";

interface MusicNodes {
  type: BackgroundMusicType;
  nodes: (AudioNode | OscillatorNode | BiquadFilterNode | GainNode)[];
  intervalId?: ReturnType<typeof setInterval>;
}

// Helper to promisify the callback-based decodeAudioData
const decodeAudioDataAsync = (
  context: AudioContext,
  arrayBuffer: ArrayBuffer
): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    context.decodeAudioData(arrayBuffer, resolve, reject);
  });
};

// Helper to create a single harmonic for the Tibetan bowl
const createBowlHarmonic = (
  context: AudioContext,
  masterGain: GainNode,
  fundamental: number,
  harmonic: number,
  index: number
): AudioNode[] => {
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(fundamental * harmonic, context.currentTime);

  const amplitude = 0.3 / (index + 1);
  const decay = 8 + Math.random() * 4;

  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(amplitude, context.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + decay);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(context.currentTime);
  osc.stop(context.currentTime + decay);

  return [osc, gain];
};

// Map of sound profiles for one-shot tones
const soundProfiles = {
  inhale: {
    freq: 660,
    gain: 0.2,
    duration: 0.15,
    type: "sine" as OscillatorType,
  },
  exhale: {
    freq: 440,
    gain: 0.15,
    duration: 0.2,
    type: "sine" as OscillatorType,
  },
  chime: {
    freq: 880,
    gain: 0.4,
    duration: 0.2,
    type: "triangle" as OscillatorType,
  },
  hold: {
    freq: 523.25,
    gain: 0.3,
    duration: 0.5,
    type: "sine" as OscillatorType,
  },
  bell: {
    freq: 523.25,
    gain: 0.2,
    duration: 3,
    type: "sine" as OscillatorType,
  },
};

// Reusable helper to play a simple tone
const playOneShotTone = (
  context: AudioContext,
  output: AudioNode,
  profile: (typeof soundProfiles)[keyof typeof soundProfiles]
): AudioNode[] => {
  const osc = context.createOscillator();
  const gainNode = context.createGain();

  osc.type = profile.type;
  osc.frequency.setValueAtTime(profile.freq, context.currentTime);
  gainNode.gain.setValueAtTime(profile.gain, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    context.currentTime + profile.duration
  );

  osc.connect(gainNode);
  gainNode.connect(output);
  osc.start(context.currentTime);
  osc.stop(context.currentTime + profile.duration);

  return [osc, gainNode];
};

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicNodesRef = useRef<MusicNodes | null>(null);
  const breathingBellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeechReady, setIsSpeechReady] = useState(false);

  useEffect(() => {
    if (!isBrowser || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setIsSpeechReady(true);
        window.speechSynthesis.onvoiceschanged = null;
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (!isBrowser) return null;
    if (!audioContextRef.current) {
      try {
        const context = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        audioContextRef.current = context;
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return null;
      }
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback(
    (type: keyof typeof soundProfiles) => {
      const context = getAudioContext();
      if (!context) return;
      const profile = soundProfiles[type];
      if (!profile) return;

      playOneShotTone(context, context.destination, profile);
    },
    [getAudioContext]
  );

  const speak = useCallback(
    (text: string) => {
      if (!isBrowser || !("speechSynthesis" in window) || !isSpeechReady) {
        if (!isSpeechReady) console.warn("Speech engine not ready, skipping.");
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const englishVoices = voices.filter((v) => v.lang.startsWith("en-"));
      let bestVoice: SpeechSynthesisVoice | null = null;

      if (englishVoices.length > 0) {
        const voicePreferences = [
          /google/i,
          /samantha|alex/i,
          /zira|david/i,
          /premium|enhanced|neural/i,
        ];

        for (const preference of voicePreferences) {
          const foundVoice = englishVoices.find((v) =>
            // FIX: Guard against v.name being null/undefined
            preference.test((v.name || "").toLowerCase())
          );
          if (foundVoice) {
            bestVoice = foundVoice;
            break;
          }
        }

        if (!bestVoice) {
          bestVoice =
            englishVoices.find((v) => v.lang === "en-US" && v.localService) ||
            englishVoices[0];
        }
      }

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.rate = 0.85;
      utterance.pitch = 0.95;

      window.speechSynthesis.speak(utterance);
    },
    [voices, isSpeechReady]
  );

  const startBackgroundMusic = useCallback(
    async (musicType: BackgroundMusicType, getIsCancelled?: () => boolean) => {
      const context = getAudioContext();
      const isCancelled = getIsCancelled || (() => false);

      if (
        !context ||
        backgroundMusicNodesRef.current ||
        musicType === BackgroundMusicType.Off ||
        isCancelled()
      )
        return;

      const allNodes: (
        | AudioNode
        | OscillatorNode
        | BiquadFilterNode
        | GainNode
      )[] = [];
      let intervalId: ReturnType<typeof setInterval> | undefined;
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0, context.currentTime);
      masterGain.connect(context.destination);
      allNodes.push(masterGain);

      switch (musicType) {
        case BackgroundMusicType.AmbientHum:
          masterGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 3);
          const osc1 = context.createOscillator();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(80, context.currentTime);
          osc1.connect(masterGain);
          osc1.start();

          const osc2 = context.createOscillator();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(80.5, context.currentTime);
          osc2.connect(masterGain);
          osc2.start();
          allNodes.push(osc1, osc2);
          break;

        case BackgroundMusicType.TibetanSingingBowl:
          masterGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 2);
          const playBowl = () => {
            const fundamental = 130 + Math.random() * 20;
            const harmonics = [1, 2.1, 3.2, 4.5, 6.1];
            harmonics.forEach((harmonic, index) => {
              const harmonicNodes = createBowlHarmonic(
                context,
                masterGain,
                fundamental,
                harmonic,
                index
              );
              allNodes.push(...harmonicNodes);
            });
          };
          playBowl();
          intervalId = setInterval(playBowl, 12000 + Math.random() * 5000);
          break;

        case BackgroundMusicType.BreathingBell:
          masterGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 1);

          let breathPhase = 0;
          const breathPattern = [4000, 7000, 8000];
          const scheduleNextBell = () => {
            if (isCancelled()) return;

            const bellNodes = playOneShotTone(
              context,
              masterGain,
              soundProfiles.bell
            );
            allNodes.push(...bellNodes);

            const nextDelay = breathPattern[breathPhase];
            breathPhase = (breathPhase + 1) % breathPattern.length;
            breathingBellTimeoutRef.current = setTimeout(
              scheduleNextBell,
              nextDelay
            );
          };
          scheduleNextBell();
          break;

        case BackgroundMusicType.GentleRain:
        case BackgroundMusicType.OmChant:
          try {
            const filePath =
              musicType === BackgroundMusicType.GentleRain
                ? "./audio/rain.mp3"
                : "./audio/om.mp3";
            const volume =
              musicType === BackgroundMusicType.GentleRain ? 0.08 : 0.05;

            const response = await fetch(filePath);
            if (isCancelled()) return;
            const arrayBuffer = await response.arrayBuffer();
            if (isCancelled()) return;

            const audioBuffer = await decodeAudioDataAsync(
              context,
              arrayBuffer
            );
            if (isCancelled()) return;

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;
            source.connect(masterGain);
            source.start();

            masterGain.gain.linearRampToValueAtTime(
              volume,
              context.currentTime + 3
            );
            allNodes.push(source);
          } catch (error) {
            if (!isCancelled()) {
              console.error(
                "Error loading or playing local audio file:",
                error
              );
            }
            return;
          }
          break;
      }

      if (isCancelled()) {
        allNodes.forEach((node) => {
          if ("stop" in node && typeof node.stop === "function") {
            try {
              (node as OscillatorNode | AudioBufferSourceNode).stop();
            } catch (e) {
              /* ignore */
            }
          }
          if ("disconnect" in node && typeof node.disconnect === "function") {
            node.disconnect();
          }
        });
        return;
      }

      backgroundMusicNodesRef.current = {
        type: musicType,
        nodes: allNodes,
        intervalId,
      };
    },
    [getAudioContext]
  );

  const stopBackgroundMusic = useCallback(() => {
    const context = getAudioContext();
    const music = backgroundMusicNodesRef.current;
    if (!context || !music) return;

    // FIX: Defensively clear both timeout and interval
    if (breathingBellTimeoutRef.current) {
      clearTimeout(breathingBellTimeoutRef.current);
      breathingBellTimeoutRef.current = null;
    }
    if (music.intervalId) {
      clearInterval(music.intervalId);
    }

    const masterGain = music.nodes[0] as GainNode;
    const fadeOutTime = context.currentTime + 2;
    masterGain.gain.linearRampToValueAtTime(0, fadeOutTime);

    music.nodes.forEach((node) => {
      if ("stop" in node && typeof node.stop === "function") {
        try {
          (node as OscillatorNode | AudioBufferSourceNode).stop(fadeOutTime);
        } catch (e) {
          /* already stopped */
        }
      }
    });

    setTimeout(() => {
      music.nodes.forEach((node) => {
        if ("disconnect" in node && typeof node.disconnect === "function") {
          node.disconnect();
        }
      });
    }, 2000);

    backgroundMusicNodesRef.current = null;
  }, [getAudioContext]);

  return {
    playSound,
    speak,
    startBackgroundMusic,
    stopBackgroundMusic,
    isSpeechReady,
  };
};
