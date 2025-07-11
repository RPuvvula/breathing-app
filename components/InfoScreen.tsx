import React from "react";

interface InfoScreenProps {
  onClose: () => void;
}

const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-6">
    <h3 className="text-2xl font-bold text-blue-500 dark:text-blue-400 mb-2">
      {title}
    </h3>
    <div className="space-y-2 text-gray-700 dark:text-gray-300">{children}</div>
  </div>
);

export const InfoScreen: React.FC<InfoScreenProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            About the Method
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-800 dark:text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
          <InfoSection title="The Breathing Technique">
            <p>
              The Wim Hof Method breathing technique is a simple yet powerful
              way to influence your nervous system. It consists of rounds of
              deep, rhythmic breaths followed by a breath-hold.
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>
                <strong>Power Breaths:</strong> Inhale deeply through the nose
                or mouth, and exhale unforced through the mouth. Repeat 30-40
                times. You may feel light-headed or tingling sensations.
              </li>
              <li>
                <strong>The Hold:</strong> After the last exhalation, hold your
                breath for as long as you can without force.
              </li>
              <li>
                <strong>Recovery Breath:</strong> When you feel the urge to
                breathe, take one deep breath in and hold it for 15 seconds.
              </li>
            </ol>
          </InfoSection>

          <InfoSection title="Potential Benefits">
            <p>Practitioners report a wide range of benefits, including:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Increased energy and focus</li>
              <li>Reduced stress levels</li>
              <li>Strengthened immune system</li>
              <li>Improved sleep quality</li>
              <li>Enhanced sports performance</li>
            </ul>
          </InfoSection>

          <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 text-red-800 dark:text-red-200 p-4 rounded-r-lg">
            <h3 className="text-2xl font-bold mb-2">
              CRITICAL SAFETY WARNINGS
            </h3>
            <p className="font-semibold mb-2">
              Always practice in a safe environment and without force.
            </p>
            <ul className="list-disc list-inside space-y-2 font-medium">
              <li>
                <strong className="uppercase">NEVER</strong> practice in or near
                water (e.g., shower, bath, pool, ocean). The technique can cause
                fainting, which is extremely dangerous in water.
              </li>
              <li>
                <strong className="uppercase">NEVER</strong> practice while
                driving a vehicle or operating machinery.
              </li>
              <li>
                If you are pregnant, have epilepsy, high blood pressure, or a
                history of heart disease or other serious health conditions,{" "}
                <strong className="uppercase">DO NOT</strong> practice without
                consulting a medical professional first.
              </li>
              <li>
                Listen to your body. If you feel sharp pain or extreme
                discomfort, stop immediately. Light-headedness is normal, but
                fainting is not the goal.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
