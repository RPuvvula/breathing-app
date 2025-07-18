import React, { useState, useEffect, useCallback } from "react";
import { Phase, BackgroundMusicType } from "../types";
import { useAudio } from "../hooks/useAudio";

interface SessionScreenProps {
  breathsPerRound: number;
  totalRounds: number;
  enableSpokenGuidance: boolean;
  backgroundMusicType: BackgroundMusicType;
  fastPacedBreathing: boolean;
  skipInitialPreparation?: boolean;
  onFinish: (retentionTimes: number[], durationInSeconds: number) => void;
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
  skipInitialPreparation = false,
  onFinish,
}) => {
  const [phase, setPhase] = useState<Phase>(
    skipInitialPreparation ? Phase.Preparing : Phase.InitialPreparation
  );
  const [currentRound, setCurrentRound] = useState(1);
  const [breathCount, setBreathCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [retentionTimes, setRetentionTimes] = useState<number[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const {
    playSound,
    speak,
    startBackgroundMusic,
    stopBackgroundMusic,
    isSpeechReady,
  } = useAudio();
  const [initialPromptSpoken, setInitialPromptSpoken] = useState(false);

  const instructionText = {
    [Phase.InitialPreparation]: "Get Ready...",
    [Phase.Preparing]: `Get ready for Round ${currentRound}`,
    [Phase.Breathing]: "Breathe deeply... In... Out...",
    [Phase.Retention]:
      "Hold your breath. Tap the button below when you need to breathe.",
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
    const durationInSeconds = Math.round(
      (Date.now() - sessionStartTime) / 1000
    );
    setTimeout(() => onFinish(retentionTimes, durationInSeconds), 2000);
  }, [onFinish, retentionTimes, speakIfEnabled, sessionStartTime]);

  // This effect's purpose is to fire the initial prompt as soon as the
  // speech engine is ready, solving the race condition in Firefox.
  useEffect(() => {
    if (
      phase === Phase.InitialPreparation &&
      isSpeechReady &&
      !initialPromptSpoken
    ) {
      speakIfEnabled(
        "Get ready to begin. Find a comfortable position and relax."
      );
      setInitialPromptSpoken(true);
    }
  }, [phase, isSpeechReady, initialPromptSpoken, speakIfEnabled]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    const breathDuration = fastPacedBreathing ? 1600 : 2000;

    if (phase === Phase.InitialPreparation) {
      // Voice prompt is now handled by a separate, dedicated effect that
      // waits for the speech engine to be ready.
      interval = setTimeout(() => {
        setPhase(Phase.Preparing);
      }, 8000);
    } else if (phase === Phase.Preparing) {
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
        speakIfEnabled(
          "Final exhalation... and hold. When you feel the urge to breathe, tap the button to continue."
        );
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

  const handleEndEarly = () => {
    onFinish(
      retentionTimes,
      Math.round((Date.now() - sessionStartTime) / 1000)
    );
  };

  const getCircleAnimation = () => {
    switch (phase) {
      case Phase.InitialPreparation:
        return "animate-slow-pulse";
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
    <div className="flex flex-col items-center h-full p-4 text-white text-center select-none bg-gradient-to-br from-gray-900 to-blue-900">
      <style>{`
        .animate-inhale { animation: inhale ${breathAnimationDuration}s ease-in-out forwards; }
        .animate-exhale { animation: exhale ${breathAnimationDuration}s ease-in-out forwards; }
        @keyframes inhale { from { transform: scale(1); } to { transform: scale(1.15); } }
        @keyframes exhale { from { transform: scale(1.15); } to { transform: scale(1); } }
        @keyframes slow-pulse { 
          0%, 100% { transform: scale(1); opacity: 0.8; } 
          50% { transform: scale(1.05); opacity: 1; } 
        }
        .animate-slow-pulse { animation: slow-pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      {/* Header */}
      <div className="w-full flex justify-between items-center flex-shrink-0">
        <span className="text-lg font-medium">
          Round: {currentRound > totalRounds ? totalRounds : currentRound}/
          {totalRounds}
        </span>
        <button
          type="button"
          onClick={handleEndEarly}
          className="bg-red-500/50 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-full transition-colors"
        >
          End
        </button>
      </div>

      {/* Main Content Wrapper - this grows to fill space and centers its content */}
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        {phase === Phase.InitialPreparation ? (
          <div className="flex flex-col items-center justify-center text-center max-w-lg px-4">
            <div
              className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-1000 ease-in-out ${getCircleAnimation()}`}
            >
              <div className="absolute w-full h-full rounded-full border-2 border-white/20"></div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mt-8">
              Prepare for Your Session
            </h2>
            <p className="text-xl mt-2 opacity-80">
              {totalRounds} Rounds &bull; {breathsPerRound} Breaths
            </p>
            <p className="text-lg mt-6 opacity-80">
              The first round will begin shortly.
            </p>
            <div className="mt-8 p-4 bg-black/20 rounded-lg text-base max-w-md">
              <p className="font-bold text-blue-300">Quick Tip</p>
              <p className="mt-1 opacity-90">
                During the breath-hold, listen to your body and tap the{" "}
                <span className="font-semibold">END HOLD</span> button when
                you're ready to continue.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
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
                  <span className="text-7xl font-mono">
                    {formatTime(timer)}
                  </span>
                )}
                {phase === Phase.Recovery && (
                  <span className="text-7xl font-mono">{timer}</span>
                )}
              </div>
            </div>
            <p className="text-2xl font-light h-16 mt-4 flex items-center justify-center">
              {instructionText[phase]}
            </p>

            <div className="h-20 flex items-center justify-center mt-2">
              {phase === Phase.Retention && (
                <button
                  type="button"
                  onClick={handleRetentionEnd}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-12 rounded-full text-xl shadow-lg transform hover:scale-105 transition-transform animate-pulse"
                >
                  END HOLD
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
