import React from "react";
import { SessionRecord } from "../types";
import { LaurelWreathIcon } from "./Icons";

interface PostSessionScreenProps {
  session: SessionRecord;
  history: SessionRecord[];
  onDone: () => void;
  onGoAgain: () => void;
  onShowHistory: () => void;
}

// Helper to get unique days, needed for streak calculation
const getUniqueDays = (history: SessionRecord[]) => {
  const dayTimestamps = new Set<number>();
  history.forEach((session) => {
    const d = new Date(session.date);
    d.setHours(0, 0, 0, 0);
    dayTimestamps.add(d.getTime());
  });
  return Array.from(dayTimestamps).sort((a, b) => b - a);
};

// Helper to calculate streak
const calculateStreak = (history: SessionRecord[]): number => {
  if (history.length === 0) return 0;
  const uniqueDays = getUniqueDays(history);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If the last session wasn't today, the streak is broken, but this session starts a new one.
  if (uniqueDays[0] !== today.getTime()) {
    return 1;
  }

  let streak = 0;
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 0; i < uniqueDays.length; i++) {
    const expectedDate = new Date(today.getTime() - i * oneDay);
    if (uniqueDays[i] === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const StatBox: React.FC<{ value: string | number; label: string }> = ({
  value,
  label,
}) => (
  <div className="flex flex-col items-center w-24">
    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
      {value}
    </span>
    <span className="text-xs uppercase opacity-70 tracking-wider text-gray-500 dark:text-gray-400 mt-1">
      {label}
    </span>
  </div>
);

// Time formatter
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export const PostSessionScreen: React.FC<PostSessionScreenProps> = ({
  session,
  history,
  onDone,
  onGoAgain,
  onShowHistory,
}) => {
  const streak = calculateStreak(history);

  // Calculate stats for the current session
  const sessionSeconds = session.durationInSeconds || 0;
  const sessionMins = Math.floor(sessionSeconds / 60);
  const sessionMinsDisplay =
    sessionMins > 0 ? sessionMins : sessionSeconds > 0 ? "< 1" : 0;

  const highestHold =
    session.retentionTimes.length > 0 ? Math.max(...session.retentionTimes) : 0;
  const rounds = session.rounds;

  return (
    <div className="flex flex-col h-full w-full text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 select-none">
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6 pt-12">
        <div className="flex justify-center items-center w-full max-w-md mb-10 sm:mb-16">
          <StatBox value={sessionMinsDisplay} label="mins this session" />
          <div className="h-10 w-px bg-gray-300 dark:bg-gray-600 mx-4 sm:mx-6"></div>
          <StatBox value={formatTime(highestHold)} label="best hold" />
          <div className="h-10 w-px bg-gray-300 dark:bg-gray-600 mx-4 sm:mx-6"></div>
          <StatBox value={rounds} label="rounds" />
        </div>

        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center mb-8 sm:mb-12">
          <div className="absolute inset-0 text-blue-500/20 dark:text-blue-400/20">
            <LaurelWreathIcon className="w-full h-full" />
          </div>
          <span className="text-8xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
            {streak}
          </span>
          <span className="text-lg tracking-wider -mt-2 text-gray-600 dark:text-gray-400">
            consecutive days
          </span>
        </div>

        <div>
          <p className="text-lg text-gray-800 dark:text-gray-200">
            Great work. Keep going!
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 p-4 pb-6 w-full max-w-sm mx-auto space-y-3">
        <button
          type="button"
          onClick={onDone}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-colors transform hover:scale-105"
        >
          Continue
        </button>
        <div className="flex space-x-3 text-center">
          <button
            type="button"
            onClick={onGoAgain}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-xl transition-colors"
          >
            Go Again
          </button>
          <button
            type="button"
            onClick={onShowHistory}
            className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-xl transition-colors"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
};
