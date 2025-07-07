
import React from 'react';
import { AppSettings, BackgroundMusicType } from '../types';

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
      <span className="font-bold text-blue-600 dark:text-blue-400">{value}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
    />
  </div>
);

const Toggle: React.FC<{
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-lg text-gray-700 dark:text-gray-300">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </div>
    </label>
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
                            ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
                            : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
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
      { value: BackgroundMusicType.Off, label: 'Off' },
      { value: BackgroundMusicType.AmbientHum, label: 'Hum' },
      { value: BackgroundMusicType.ZenGarden, label: 'Zen' },
      { value: BackgroundMusicType.OceanWaves, label: 'Ocean' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-6 text-center">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Breathing Session</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Configure your session and find your inner strength.</p>
        </div>

        <div className="space-y-6">
          <Slider label="Breaths per Round" value={settings.breathsPerRound} min={20} max={50} step={5} onChange={(e) => onSettingsChange({ breathsPerRound: Number(e.target.value) })} />
          <Slider label="Number of Rounds" value={settings.totalRounds} min={1} max={5} step={1} onChange={(e) => onSettingsChange({ totalRounds: Number(e.target.value) })} />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
             <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 text-left">Experience</h3>
             <Toggle label="Spoken Guidance" checked={settings.enableSpokenGuidance} onChange={e => onSettingsChange({ enableSpokenGuidance: e.target.checked })} />
             <OptionSelector
                label="Calm Background"
                options={musicOptions}
                selectedValue={settings.backgroundMusicType}
                onChange={value => onSettingsChange({ backgroundMusicType: value as BackgroundMusicType })}
             />
        </div>
        
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg" role="alert">
          <p className="font-bold">Important Safety Notice</p>
          <p className="text-sm">Never practice in or near water or while driving. 
            <button onClick={onShowInfo} className="underline font-semibold ml-1">Learn more</button>.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
            <button
              onClick={onStart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              Start Session
            </button>
            {hasHistory && (
                 <button
                    onClick={onShowHistory}
                    className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-3 px-4 rounded-xl text-lg transition-colors"
                    >
                    Session History
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
