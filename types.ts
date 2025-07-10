export enum Theme {
  Light = "light",
  Dark = "dark",
}

export enum Screen {
  Settings,
  Session,
  Info,
  History,
}

export enum Phase {
  Preparing,
  Breathing,
  Retention,
  Recovery,
  Transition,
  Finished,
}

export interface SessionRecord {
  id: string;
  date: string;
  rounds: number;
  retentionTimes: number[];
}

export enum BackgroundMusicType {
  Off = "off",
  AmbientHum = "hum",
  TibetanSingingBowl = "TibetanSingingBowl",
  BreathingBell = "BreathingBell",
  GentleRain = "Meditation",
}

export interface AppSettings {
  breathsPerRound: number;
  totalRounds: number;
  enableSpokenGuidance: boolean;
  backgroundMusicType: BackgroundMusicType;
  fastPacedBreathing: boolean;
}
