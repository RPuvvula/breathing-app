import React, { useState, useEffect, useCallback } from "react";
import { Phase, BackgroundMusicType } from "../types";
import { useAudio } from "../hooks/useAudio";

interface SessionScreenProps {
  breathsPerRound: number;
  totalRounds: number;
  enableSpokenGuidance: boolean;
  backgroundMusicType: BackgroundMusicType;
  fastPacedBreathing: boolean;
  onFinish: (retentionTimes: number[]) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const isBrowser = typeof window !== "undefined";

export const SessionScreen: React.FC<SessionScreenProps> = ({
  breathsPerRound,
  totalRounds,
  enableSpokenGuidance,
  backgroundMusicType,
  fastPacedBreathing,
  onFinish,
}) => {
  const [phase, setPhase] = useState<Phase>(Phase.Preparing);
  const [currentRound, setCurrentRound] = useState(1);
  const [breathCount, setBreathCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [retentionTimes, setRetentionTimes] = useState<number[]>([]);
  const { playSound, speak, startBackgroundMusic, stopBackgroundMusic } =
    useAudio();

  const instructionText = {
    [Phase.Preparing]: `Get ready for Round ${currentRound}`,
    [Phase.Breathing]: "Breathe deeply... In... Out...",
    [Phase.Retention]: "Hold your breath...",
    [Phase.Recovery]: "Quickly inhale and hold",
    [Phase.Transition]: "Release breath hold... let it go.",
    [Phase.Finished]: "Session Complete!",
  };

  const speakIfEnabled = useCallback(
    (text: string) => {
      if (enableSpokenGuidance) {
        speak(text);
      }
    },
    [enableSpokenGuidance, speak]
  );

  useEffect(() => {
    let isCancelled = false;

    if (backgroundMusicType !== BackgroundMusicType.Off) {
      startBackgroundMusic(backgroundMusicType, () => isCancelled);
    }

    return () => {
      isCancelled = true;
      stopBackgroundMusic();
      // Ensure any lingering speech is cut off
      if (isBrowser && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [backgroundMusicType, startBackgroundMusic, stopBackgroundMusic]);

  const resetForNextRound = useCallback(() => {
    setBreathCount(0);
    setTimer(0);
    setCurrentRound((r) => r + 1);
    setPhase(Phase.Preparing);
  }, []);

  const handleFinishSession = useCallback(() => {
    setPhase(Phase.Finished);
    speakIfEnabled("Session complete. Well done.");
    setTimeout(() => onFinish(retentionTimes), 2000);
  }, [onFinish, retentionTimes, speakIfEnabled]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    const breathDuration = fastPacedBreathing ? 1600 : 2000;

    if (phase === Phase.Preparing) {
      speakIfEnabled(`Get ready for Round ${currentRound}.`);
      interval = setTimeout(() => {
        setPhase(Phase.Breathing);
      }, 3000);
    } else if (phase === Phase.Breathing) {
      if (breathCount === 0) {
        speakIfEnabled("Begin breathing.");
      }
      playSound(breathCount % 2 === 0 ? "inhale" : "exhale");
      if (breathCount >= breathsPerRound * 2) {
        setPhase(Phase.Retention);
      } else {
        interval = setTimeout(
          () => setBreathCount((c) => c + 1),
          breathDuration
        );
      }
    } else if (phase === Phase.Retention) {
      if (timer === 0) {
        // only speak on first render of this phase
        speakIfEnabled("Exhale, and hold.");
        playSound("hold");
      }
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    } else if (phase === Phase.Recovery) {
      if (timer === 0) {
        // only on first render
        setTimer(15);
        speakIfEnabled("Inhale, and hold for 15 seconds.");
      }
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            playSound("chime");
            if (currentRound < totalRounds) {
              setPhase(Phase.Transition);
            } else {
              handleFinishSession();
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (phase === Phase.Transition) {
      speakIfEnabled("Release breath hold... let it go.");
      interval = setTimeout(() => {
        resetForNextRound();
      }, 5000); // 5 second pause
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    phase,
    breathCount,
    currentRound,
    totalRounds,
    breathsPerRound,
    playSound,
    speakIfEnabled,
    handleFinishSession,
    resetForNextRound,
    timer,
    fastPacedBreathing,
  ]);

  const handleRetentionEnd = () => {
    setRetentionTimes((times) => [...times, timer]);
    setTimer(0); // Reset timer for recovery phase
    setPhase(Phase.Recovery);
    playSound("chime");
  };

  const getCircleAnimation = () => {
    switch (phase) {
      case Phase.Breathing:
        return breathCount % 2 === 0 ? "animate-inhale" : "animate-exhale";
      case Phase.Recovery:
        return "scale-110";
      case Phase.Retention:
        return "scale-90";
      default:
        return "scale-100";
    }
  };

  const breathAnimationDuration = fastPacedBreathing ? 1.6 : 2;

  return (
    <div className="flex flex-col items-center justify-between min-h-full p-4 text-white text-center select-none bg-gradient-to-br from-gray-900 to-blue-900">
      <style>{`
        .animate-inhale { animation: inhale ${breathAnimationDuration}s ease-in-out forwards; }
        .animate-exhale { animation: exhale ${breathAnimationDuration}s ease-in-out forwards; }
        @keyframes inhale { from { transform: scale(1); } to { transform: scale(1.15); } }
        @keyframes exhale { from { transform: scale(1.15); } to { transform: scale(1); } }
      `}</style>

      <div className="w-full flex justify-between items-center">
        <span className="text-lg font-medium">
          Round: {currentRound > totalRounds ? totalRounds : currentRound}/
          {totalRounds}
        </span>
        <button
          onClick={() => onFinish(retentionTimes)}
          className="bg-red-500/50 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-full transition-colors"
        >
          End
        </button>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
        <div
          className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-1000 ease-in-out ${getCircleAnimation()}`}
        >
          <div className="absolute w-full h-full rounded-full border-2 border-white/20"></div>
          <div className="text-center">
            {phase === Phase.Breathing && (
              <span className="text-7xl font-bold">
                {Math.ceil((breathCount + 1) / 2)}
              </span>
            )}
            {(phase === Phase.Retention || phase === Phase.Finished) && (
              <span className="text-7xl font-mono">{formatTime(timer)}</span>
            )}
            {phase === Phase.Recovery && (
              <span className="text-7xl font-mono">{timer}</span>
            )}
          </div>
        </div>
        <p className="text-2xl font-light h-16">{instructionText[phase]}</p>
      </div>

      <div className="h-20 w-full flex items-center justify-center">
        {phase === Phase.Retention && (
          <button
            onClick={handleRetentionEnd}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform"
          >
            END HOLD
          </button>
        )}
      </div>
    </div>
  );
};
