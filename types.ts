export enum Theme {
  Light = "light",
  Dark = "dark",
}

export enum Screen {
  Settings,
  Session,
  Info,
  History,
  PostSession,
}

export enum Phase {
  InitialPreparation,
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
  durationInSeconds: number;
}

export enum BackgroundMusicType {
  Off = "off",
  AmbientHum = "hum",
  TibetanSingingBowl = "TibetanSingingBowl",
  BreathingBell = "BreathingBell",
  GentleRain = "Meditation",
  OmChant = "om",
}

export interface AppSettings {
  breathsPerRound: number;
  totalRounds: number;
  enableSpokenGuidance: boolean;
  backgroundMusicType: BackgroundMusicType;
  fastPacedBreathing: boolean;
}
