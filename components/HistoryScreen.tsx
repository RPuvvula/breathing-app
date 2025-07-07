
import React from 'react';
import { SessionRecord } from '../types';
import { CloseIcon } from './Icons';

interface HistoryScreenProps {
  sessions: SessionRecord[];
  onClose: () => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ sessions, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Session History</h2>
          <button onClick={onClose} aria-label="Close history" className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <CloseIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>

        {sessions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-600 dark:text-gray-400">You haven't completed any sessions yet.</p>
                <p className="text-gray-600 dark:text-gray-400">Your history will appear here once you do.</p>
            </div>
        ) : (
            <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                      {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="flex justify-around items-end border-t border-gray-200 dark:border-gray-700 pt-3">
                  {session.retentionTimes.map((time, index) => (
                    <div key={index} className="text-center">
                      <div className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">{formatTime(time)}</div>
                      <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Round {index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};
