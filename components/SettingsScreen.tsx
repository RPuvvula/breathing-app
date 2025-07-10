import React from "react";
import { AppSettings, BackgroundMusicType } from "../types";

interface SettingsScreenProps {
  settings: AppSettings;
  onSettingsChange: (newSettings: Partial<AppSettings>) => void;
  onStart: () => void;
  onShowInfo: () => void;
  onShowHistory: () => void;
  hasHistory: boolean;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, min, max, step, onChange }) => (
  <div className="w-full">
    <label className="flex justify-between items-center text-lg text-gray-700 dark:text-gray-300">
      <span>{label}</span>
      <span className="font-bold text-blue-600 dark:text-blue-400">
        {value}
      </span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
    />
  </div>
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-lg text-gray-700 dark:text-gray-300">{label}</span>
    <label className="relative cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
      <div className="absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform peer-checked:translate-x-6"></div>
    </label>
  </div>
);

const OptionSelector: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}> = ({ label, options, selectedValue, onChange }) => (
  <div>
    <span className="text-lg text-gray-700 dark:text-gray-300">{label}</span>
    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
      {options.map(({ value, label: optionLabel }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-2 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none ${
            selectedValue === value
              ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow"
              : "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {optionLabel}
        </button>
      ))}
    </div>
  </div>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSettingsChange,
  onStart,
  onShowInfo,
  onShowHistory,
  hasHistory,
}) => {
  const musicOptions = [
    { value: BackgroundMusicType.Off, label: "Off" },
    { value: BackgroundMusicType.AmbientHum, label: "Hum" },
    { value: BackgroundMusicType.TibetanSingingBowl, label: "Bowl" },
    { value: BackgroundMusicType.BreathingBell, label: "Bell" },
    { value: BackgroundMusicType.GentleRain, label: "Meditation" },
    { value: BackgroundMusicType.OmChant, label: "Om" },
  ];

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Action Zone (part of the main scroll flow) */}
      <div className="flex flex-col items-center justify-center pt-24 pb-8 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
          Ready to Breathe?
        </h1>
        <button
          onClick={onStart}
          aria-label="Start session"
          className="mt-6 w-48 h-48 sm:w-56 sm:h-56 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex flex-col items-center justify-center shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
        >
          <span className="text-4xl font-bold tracking-wider">START</span>
          <span className="mt-2 text-sm opacity-80">
            {settings.totalRounds} Rounds &bull; {settings.breathsPerRound}{" "}
            Breaths
          </span>
        </button>
      </div>

      {/* Configuration Zone (part of the main scroll flow) */}
      <div className="max-w-md mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Customize Your Session
            </h2>
          </div>

          <div className="space-y-6">
            <Slider
              label="Breaths per Round"
              value={settings.breathsPerRound}
              min={20}
              max={50}
              step={5}
              onChange={(e) =>
                onSettingsChange({ breathsPerRound: Number(e.target.value) })
              }
            />
            <Slider
              label="Number of Rounds"
              value={settings.totalRounds}
              min={1}
              max={5}
              step={1}
              onChange={(e) =>
                onSettingsChange({ totalRounds: Number(e.target.value) })
              }
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Experience
            </h3>
            <Toggle
              label="Spoken Guidance"
              checked={settings.enableSpokenGuidance}
              onChange={(e) =>
                onSettingsChange({ enableSpokenGuidance: e.target.checked })
              }
            />
            <Toggle
              label="Fast Paced Breaths"
              checked={settings.fastPacedBreathing}
              onChange={(e) =>
                onSettingsChange({ fastPacedBreathing: e.target.checked })
              }
            />
            <OptionSelector
              label="Calm Background"
              options={musicOptions}
              selectedValue={settings.backgroundMusicType}
              onChange={(value) =>
                onSettingsChange({
                  backgroundMusicType: value as BackgroundMusicType,
                })
              }
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div
              className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg"
              role="alert"
            >
              <p className="font-bold">Important Safety Notice</p>
              <p className="text-sm">
                Never practice in or near water or while driving.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {hasHistory && (
              <button
                onClick={onShowHistory}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-xl text-lg transition-colors"
              >
                Session History
              </button>
            )}
            <button
              onClick={onShowInfo}
              className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-xl text-lg transition-colors"
            >
              About the Method
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
