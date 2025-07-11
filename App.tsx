import { useState, useEffect, useCallback } from "react";
import { Theme, Screen, SessionRecord, AppSettings } from "./types";
import { SettingsScreen } from "./components/SettingsScreen";
import { SessionScreen } from "./components/SessionScreen";
import { InfoScreen } from "./components/InfoScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { PostSessionScreen } from "./components/PostSessionScreen";
import { SunIcon, MoonIcon } from "./components/Icons";
import {
  getTheme,
  setTheme as saveTheme,
  getSettings,
  saveSettings,
  getSessionHistory,
  saveSessionHistory,
} from "./lib/storage";

function App() {
  const [theme, setTheme] = useState<Theme>(() => getTheme() || Theme.Light);
  const [screen, setScreen] = useState<Screen>(Screen.Settings);
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);

  const [settings, setSettings] = useState<AppSettings>(getSettings);

  const [sessionHistory, setSessionHistory] =
    useState<SessionRecord[]>(getSessionHistory);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.Dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const handleFinishSession = useCallback(
    (retentionTimes: number[], durationInSeconds: number) => {
      if (retentionTimes.length > 0) {
        const newSession: SessionRecord = {
          id: new Date().toISOString(),
          date: new Date().toISOString(),
          rounds: retentionTimes.length,
          retentionTimes,
          durationInSeconds,
        };
        const updatedHistory = [newSession, ...sessionHistory];
        setSessionHistory(updatedHistory);
        setLastSession(newSession);
        saveSessionHistory(updatedHistory);
      }
      setScreen(Screen.PostSession);
    },
    [sessionHistory]
  );

  const navigate = (targetScreen: Screen) => setScreen(targetScreen);

  const handleSettingsChange = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const renderScreen = () => {
    switch (screen) {
      case Screen.Session:
        return (
          <SessionScreen
            breathsPerRound={settings.breathsPerRound}
            totalRounds={settings.totalRounds}
            enableSpokenGuidance={settings.enableSpokenGuidance}
            backgroundMusicType={settings.backgroundMusicType}
            fastPacedBreathing={settings.fastPacedBreathing}
            onFinish={handleFinishSession}
          />
        );
      case Screen.Info:
        return <InfoScreen onClose={() => navigate(Screen.Settings)} />;
      case Screen.History:
        return (
          <HistoryScreen
            sessions={sessionHistory}
            onClose={() => navigate(Screen.Settings)}
          />
        );
      case Screen.PostSession:
        if (!lastSession) {
          // Fallback if somehow we get here without a session
          return (
            <SettingsScreen
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onStart={() => navigate(Screen.Session)}
              onShowInfo={() => navigate(Screen.Info)}
              onShowHistory={() => navigate(Screen.History)}
              hasHistory={sessionHistory.length > 0}
            />
          );
        }
        return (
          <PostSessionScreen
            session={lastSession}
            history={sessionHistory}
            onDone={() => navigate(Screen.Settings)}
            onRetry={() => navigate(Screen.Session)}
            onShowHistory={() => navigate(Screen.History)}
          />
        );
      case Screen.Settings:
      default:
        return (
          <SettingsScreen
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onStart={() => navigate(Screen.Session)}
            onShowInfo={() => navigate(Screen.Info)}
            onShowHistory={() => navigate(Screen.History)}
            hasHistory={sessionHistory.length > 0}
          />
        );
    }
  };

  const showHeader = screen === Screen.Settings;

  return (
    <main className="h-screen w-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900">
      {showHeader && (
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-end items-center z-10">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === "light" ? (
              <MoonIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <SunIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </header>
      )}
      <div className="h-full w-full">{renderScreen()}</div>
    </main>
  );
}

export default App;
