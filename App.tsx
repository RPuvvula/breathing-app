import { useState, useEffect, useCallback } from "react";
import {
  Theme,
  Screen,
  SessionRecord,
  AppSettings,
  BackgroundMusicType,
} from "./types";
import { SettingsScreen } from "./components/SettingsScreen";
import { SessionScreen } from "./components/SessionScreen";
import { InfoScreen } from "./components/InfoScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { PostSessionScreen } from "./components/PostSessionScreen";
import { SunIcon, MoonIcon } from "./components/Icons";

const SETTINGS_STORAGE_KEY = "wimhof-settings";
const SESSION_STORAGE_KEY = "wimhof-sessions";

const defaultSettings: AppSettings = {
  breathsPerRound: 30,
  totalRounds: 3,
  enableSpokenGuidance: true,
  backgroundMusicType: BackgroundMusicType.Off,
  fastPacedBreathing: false,
};

function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || Theme.Light
  );
  const [screen, setScreen] = useState<Screen>(Screen.Settings);
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Migration from old setting
        if (parsed.hasOwnProperty("enableBackgroundMusic")) {
          parsed.backgroundMusicType = parsed.enableBackgroundMusic
            ? BackgroundMusicType.AmbientHum
            : BackgroundMusicType.Off;
          delete parsed.enableBackgroundMusic;
        }
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error("Failed to load settings from local storage", error);
    }
    return defaultSettings;
  });

  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === Theme.Dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to local storage", error);
    }
  }, [settings]);

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSessions) {
        setSessionHistory(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.error("Failed to load session history from local storage", error);
    }
  }, []);

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
        try {
          localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(updatedHistory)
          );
        } catch (error) {
          console.error("Failed to save session to local storage", error);
        }
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
