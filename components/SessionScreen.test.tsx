import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SessionScreen } from "./SessionScreen";
import { BackgroundMusicType } from "../types";

// Mock the useAudio hook to spy on its functions
const mockPlaySound = vi.fn();
const mockSpeak = vi.fn();

vi.mock("../hooks/useAudio", () => ({
  useAudio: () => ({
    playSound: mockPlaySound,
    speak: mockSpeak,
    startBackgroundMusic: vi.fn(),
    stopBackgroundMusic: vi.fn(),
    isSpeechReady: true, // Assume speech is always ready for tests
  }),
}));

// A helper function to render the component with default props for testing
const renderSessionScreen = (props = {}) => {
  const defaultProps = {
    breathsPerRound: 1, // Using 1 breath for a quick test cycle
    totalRounds: 1,
    enableSpokenGuidance: false,
    backgroundMusicType: BackgroundMusicType.Off,
    fastPacedBreathing: false, // Ensures a predictable 2-second interval
    skipInitialPreparation: true, // Skip the initial 8s wait
    onFinish: vi.fn(),
  };
  return render(<SessionScreen {...defaultProps} {...props} />);
};

describe("SessionScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not play an extra 'inhale' sound before the retention phase", () => {
    renderSessionScreen();

    // Starts in "Preparing" phase
    expect(screen.getByText(/Get ready for Round 1/i)).toBeInTheDocument();

    // Advance time by 3s to move to the "Breathing" phase
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Now in "Breathing" phase, an "inhale" sound should have been played.
    expect(screen.getByText(/Breathe deeply/i)).toBeInTheDocument();
    expect(mockPlaySound).toHaveBeenCalledWith("inhale");

    // Advance time by 2s for the inhale duration
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // An "exhale" sound should have been played.
    expect(mockPlaySound).toHaveBeenCalledWith("exhale");

    // Advance time by 2s for the exhale duration
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Now we should be in the "Retention" phase.
    expect(screen.getByText(/Hold your breath/i)).toBeInTheDocument();

    // Filter for only the breathing sounds.
    const breathSoundCalls = mockPlaySound.mock.calls.filter(
      (call) => call[0] === "inhale" || call[0] === "exhale"
    );

    // With the fix, the sequence should be correct.
    expect(breathSoundCalls).toEqual([["inhale"], ["exhale"]]);
  });
});
