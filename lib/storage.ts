import {
  Theme,
  AppSettings,
  SessionRecord,
  BackgroundMusicType,
} from "../types";

const SETTINGS_STORAGE_KEY = "wimhof-settings";
const SESSION_STORAGE_KEY = "wimhof-sessions";
const THEME_STORAGE_KEY = "theme";

const defaultSettings: AppSettings = {
  breathsPerRound: 30,
  totalRounds: 3,
  enableSpokenGuidance: true,
  backgroundMusicType: BackgroundMusicType.Off,
  fastPacedBreathing: false,
};

// --- Theme ---
export const getTheme = (): Theme | null => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  } catch (error) {
    console.error("Failed to read theme from local storage", error);
    return null;
  }
};

export const setTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error("Failed to save theme to local storage", error);
  }
};

// --- Settings ---
export const getSettings = (): AppSettings => {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      // Migration from old setting for backward compatibility
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
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to local storage", error);
  }
};

// --- Session History ---
export const getSessionHistory = (): SessionRecord[] => {
  try {
    const storedSessions = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessions) {
      return JSON.parse(storedSessions);
    }
  } catch (error) {
    console.error("Failed to load session history from local storage", error);
  }
  return [];
};

export const saveSessionHistory = (history: SessionRecord[]): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save session to local storage", error);
  }
};
