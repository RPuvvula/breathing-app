import { useRef, useCallback, useState, useEffect } from "react";
import { BackgroundMusicType } from "../types";

const isBrowser = typeof window !== "undefined";

interface MusicNodes {
  type: BackgroundMusicType;
  nodes: (AudioNode | OscillatorNode | BiquadFilterNode | GainNode)[];
  intervalId?: ReturnType<typeof setInterval>;
}

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicNodesRef = useRef<MusicNodes | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeechReady, setIsSpeechReady] = useState(false);

  useEffect(() => {
    if (!isBrowser || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setIsSpeechReady(true);
      }
    };

    // Voices load asynchronously.
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial call in case they are already loaded.

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []); // This effect should only run once on mount.

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
    (type: "inhale" | "exhale" | "chime" | "hold") => {
      const context = getAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      gainNode.connect(context.destination);
      oscillator.connect(gainNode);

      let freq = 440;
      let duration = 0.1;
      let gain = 0.3;

      switch (type) {
        case "inhale":
          freq = 660;
          gain = 0.2;
          duration = 0.15;
          oscillator.type = "sine";
          break;
        case "exhale":
          freq = 440;
          gain = 0.15;
          duration = 0.2;
          oscillator.type = "sine";
          break;
        case "chime":
          freq = 880;
          gain = 0.4;
          duration = 0.2;
          oscillator.type = "triangle";
          break;
        case "hold":
          freq = 523.25;
          gain = 0.3;
          duration = 0.5;
          oscillator.type = "sine";
          break;
      }

      gainNode.gain.setValueAtTime(gain, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + duration
      );

      oscillator.frequency.setValueAtTime(freq, context.currentTime);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);
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

      // --- Intelligent Voice Selection ---
      const englishVoices = voices.filter((v) => v.lang.startsWith("en-"));
      let bestVoice: SpeechSynthesisVoice | null = null;

      if (englishVoices.length > 0) {
        // Define a ranked preference list for high-quality voices.
        const voicePreferences = [
          /google/i, // Google voices are often high quality.
          /samantha|alex/i, // High-quality Apple voices.
          /zira|david/i, // High-quality Microsoft voices.
          /premium|enhanced|neural/i, // Keywords for quality.
        ];

        for (const preference of voicePreferences) {
          const foundVoice = englishVoices.find((v) =>
            preference.test(v.name.toLowerCase())
          );
          if (foundVoice) {
            bestVoice = foundVoice;
            break;
          }
        }

        // Fallback to any local US English voice, then any English voice.
        if (!bestVoice) {
          bestVoice =
            englishVoices.find((v) => v.lang === "en-US" && v.localService) ||
            englishVoices[0];
        }
      }

      // Only assign the voice if we found a suitable one.
      // This prevents an issue in Firefox where assigning `null` on the first
      // call (before voices are loaded) can cause the speech to fail silently.
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      // --- Tune for a softer, gentler tone ---
      utterance.rate = 0.85; // Slightly slower and more deliberate.
      utterance.pitch = 0.95; // Slightly deeper to reduce shrillness.

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
            const now = context.currentTime;
            const fundamental = 130 + Math.random() * 20; // Around C3 with variation

            // Create multiple harmonics for rich sound
            const harmonics = [1, 2.1, 3.2, 4.5, 6.1]; // Slightly detuned for realism

            harmonics.forEach((harmonic, index) => {
              const osc = context.createOscillator();
              const gain = context.createGain();

              osc.type = "sine";
              osc.frequency.setValueAtTime(fundamental * harmonic, now);

              // Different envelope for each harmonic
              const amplitude = 0.3 / (index + 1); // Higher harmonics are quieter
              const decay = 8 + Math.random() * 4; // 8-12 second decay

              gain.gain.setValueAtTime(0, now);
              gain.gain.linearRampToValueAtTime(amplitude, now + 0.1);
              gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

              osc.connect(gain);
              gain.connect(masterGain);

              osc.start(now);
              osc.stop(now + decay);

              allNodes.push(osc, gain);
            });
          };

          playBowl();
          intervalId = setInterval(playBowl, 12000 + Math.random() * 5000);
          break;

        case BackgroundMusicType.BreathingBell:
          masterGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 1);

          const playBell = () => {
            const now = context.currentTime;
            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, now); // C5

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(now);
            osc.stop(now + 3);

            allNodes.push(osc, gain);
          };

          // 4-7-8 breathing pattern: 4 sec in, 7 sec hold, 8 sec out
          let breathPhase = 0;
          const breathPattern = [4000, 7000, 8000]; // milliseconds for each phase
          let currentTimeout;

          const scheduleNextBell = () => {
            playBell();
            breathPhase = (breathPhase + 1) % 3;
            currentTimeout = setTimeout(
              scheduleNextBell,
              breathPattern[breathPhase]
            );
          };

          scheduleNextBell(); // Start the breathing pattern

          // Store the timeout reference for cleanup (you might want to store this differently)
          intervalId = currentTimeout;
          break;

        case BackgroundMusicType.GentleRain:
          try {
            const response = await fetch("./audio/rain.mp3");
            if (isCancelled()) return;

            const arrayBuffer = await response.arrayBuffer();
            if (isCancelled()) return;

            const audioBuffer = await context.decodeAudioData(arrayBuffer);
            if (isCancelled()) return;

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;

            source.connect(masterGain);
            source.start();

            masterGain.gain.linearRampToValueAtTime(
              0.08, // Lower volume for background
              context.currentTime + 3
            ); // Fade in
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

        case BackgroundMusicType.OmChant:
          try {
            const response = await fetch("./audio/om.mp3");
            if (isCancelled()) return;

            const arrayBuffer = await response.arrayBuffer();
            if (isCancelled()) return;

            const audioBuffer = await context.decodeAudioData(arrayBuffer);
            if (isCancelled()) return;

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;

            source.connect(masterGain);
            source.start();

            masterGain.gain.linearRampToValueAtTime(
              0.05, // Lower volume for background
              context.currentTime + 3
            ); // Fade in
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
        // If the component unmounted while we were fetching/decoding,
        // we might have already started some audio nodes. We need to stop them now,
        // because stopBackgroundMusic() was called on an empty ref.
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

    if (music.intervalId) {
      // NOTE: The BreathingBell implementation has a bug where its timeout is not
      // correctly stored or cleared. For now, we only clear intervals.
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
