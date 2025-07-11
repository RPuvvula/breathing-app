import React, { useState, useMemo } from "react";
import { SessionRecord } from "../types";
import { CloseIcon, ChevronDownIcon } from "./Icons";

interface HistoryScreenProps {
  sessions: SessionRecord[];
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

/**
 * Gets the start of the week for a given date.
 * @param date The date to find the start of the week for.
 * @param startDay The day the week starts on (0 for Sunday, 1 for Monday). Defaults to 1.
 * @returns A new Date object set to the start of the week at 00:00:00.
 */
const getStartOfWeek = (date: Date, startDay: number = 1): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust day to be 0 for Monday, 1 for Tuesday, etc. if week starts on Monday
  const relativeDay = (day - startDay + 7) % 7;
  d.setDate(d.getDate() - relativeDay);
  d.setHours(0, 0, 0, 0);
  return d;
};

const SessionItem: React.FC<{
  session: SessionRecord;
  isInitiallyExpanded?: boolean;
}> = ({ session, isInitiallyExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const bestHold =
    session.retentionTimes.length > 0 ? Math.max(...session.retentionTimes) : 0;
  const totalHold = session.retentionTimes.reduce((sum, time) => sum + time, 0);
  const avgHold =
    session.retentionTimes.length > 0
      ? Math.round(totalHold / session.retentionTimes.length)
      : 0;

  const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = new Date(session.date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-5 transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <div className="flex-grow">
          <p className="font-semibold text-base text-gray-800 dark:text-gray-200">
            {formattedDate}
            <span className="font-normal text-gray-500 dark:text-gray-400">
              {" "}
              — {formattedTime}
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
            <span className="font-medium">
              {session.rounds} {session.rounds === 1 ? "Round" : "Rounds"}
            </span>
            <span className="text-gray-400 dark:text-gray-500 mx-2">|</span>
            <span>
              Best:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatTime(bestHold)}
              </span>
            </span>
            <span className="text-gray-400 dark:text-gray-500 mx-2">|</span>
            <span>
              Avg: <span className="font-semibold">{formatTime(avgHold)}</span>
            </span>
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={`session-details-${session.id}`}
          className="flex items-center justify-center mt-3 sm:mt-0 sm:ml-4 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600/80 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          Details
          <ChevronDownIcon
            className={`w-5 h-5 ml-1 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-96 mt-4 pt-4 border-t" : "max-h-0"
        }`}
        style={{
          borderTopColor: "var(--tw-border-color)",
        }} /* For transition */
      >
        <div
          id={`session-details-${session.id}`}
          className="border-gray-200 dark:border-gray-700"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3">
            {session.retentionTimes.map((time, index) => {
              const percentage = bestHold > 0 ? (time / bestHold) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="uppercase text-gray-500 dark:text-gray-400">
                      Round {index + 1}
                    </span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {formatTime(time)}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(percentage)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Round duration was ${formatTime(
                      time
                    )}, which is ${Math.round(
                      percentage
                    )}% of the session's best time.`}
                    className="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-full"
                  >
                    <div
                      className="bg-blue-700 dark:bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

type FilterType = "week" | "month" | "all";

// Helper to group sessions by time periods
const groupSessions = (
  sessions: SessionRecord[]
): { [key: string]: SessionRecord[] } => {
  const groups: { [key: string]: SessionRecord[] } = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfThisWeek = getStartOfWeek(today); // Week starts on Monday
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  sessions.forEach((session) => {
    const sessionDate = new Date(session.date);
    let groupName: string;

    if (sessionDate >= startOfThisWeek) {
      groupName = "This Week";
    } else if (sessionDate >= startOfLastWeek) {
      groupName = "Last Week";
    } else {
      groupName = sessionDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(session);
  });

  return groups;
};

const FilterTabs: React.FC<{
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}> = ({ activeFilter, onFilterChange }) => {
  const tabs: { key: FilterType; label: string }[] = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="mb-6" role="tablist" aria-label="Session History Filters">
      <div className="p-1 bg-gray-200 dark:bg-gray-800 rounded-lg flex space-x-1">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            id={`filter-tab-${index}`}
            role="tab"
            aria-selected={activeFilter === tab.key}
            aria-controls="session-history-panel"
            onClick={() => onFilterChange(tab.key)}
            className={`w-full py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
              activeFilter === tab.key
                ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-700/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  sessions,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("week");

  const filteredSessions = useMemo(() => {
    const now = new Date();
    switch (activeFilter) {
      case "week": {
        const startOfWeek = getStartOfWeek(now); // Uses Monday start
        return sessions.filter((s) => new Date(s.date) >= startOfWeek);
      }
      case "month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return sessions.filter((s) => new Date(s.date) >= startOfMonth);
      }
      case "all":
      default:
        return sessions;
    }
  }, [sessions, activeFilter]);

  const groupedSessions = useMemo(
    () => groupSessions(filteredSessions),
    [filteredSessions]
  );
  const groupOrder = useMemo(() => {
    return Object.keys(groupedSessions).sort((a, b) => {
      if (a === "This Week") return -1;
      if (b === "This Week") return 1;
      if (a === "Last Week") return -1;
      if (b === "Last Week") return 1;
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedSessions]);

  const emptyStateMessages = {
    week: "You haven't completed any sessions this week.",
    month: "You haven't completed any sessions this month.",
    all: "You haven't completed any sessions yet.",
  };

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Session History
          </h2>
          <button
            onClick={onClose}
            aria-label="Close history"
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <CloseIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>

        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div
          id="session-history-panel"
          role="tabpanel"
          aria-labelledby={`filter-tab-${
            activeFilter === "week" ? 0 : activeFilter === "month" ? 1 : 2
          }`}
        >
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {emptyStateMessages[activeFilter]}
              </p>
              <p className="mt-2 text-gray-500 dark:text-gray-500">
                {activeFilter === "all"
                  ? "Start a session and your history will appear here."
                  : "Try another filter to see older sessions."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupOrder.map((groupName, groupIndex) => (
                <section
                  key={groupName}
                  aria-labelledby={`heading-${groupName.replace(/\s/g, "")}`}
                >
                  <h3
                    id={`heading-${groupName.replace(/\s/g, "")}`}
                    className="text-lg font-bold text-gray-800 dark:text-gray-200 px-1 mb-3"
                  >
                    {groupName}
                  </h3>
                  <div className="space-y-4">
                    {groupedSessions[groupName].map((session, sessionIndex) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isInitiallyExpanded={
                          groupIndex === 0 && sessionIndex === 0
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
