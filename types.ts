
export enum Theme {
  Light = 'light',
  Dark = 'dark',
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
  Finished,
}

export interface SessionRecord {
  id: string;
  date: string;
  rounds: number;
  retentionTimes: number[];
}

export enum BackgroundMusicType {
  Off = 'off',
  AmbientHum = 'hum',
  ZenGarden = 'zen',
  OceanWaves = 'ocean',
}

export interface AppSettings {
  breathsPerRound: number;
  totalRounds: number;
  enableSpokenGuidance: boolean;
  backgroundMusicType: BackgroundMusicType;
}
