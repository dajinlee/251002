import React from 'react';
import { TransformationMode } from '../types';

interface ModeSelectorProps {
  currentMode: TransformationMode;
  onModeChange: (mode: TransformationMode) => void;
  isLoading: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, isLoading }) => {
  const modes = Object.values(TransformationMode);

  return (
    <div className="flex justify-center items-center space-x-4 p-4 bg-gray-800 rounded-lg shadow-lg">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          disabled={isLoading && mode === TransformationMode.USAnimation}
          className={`px-6 py-2 text-lg font-semibold rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
            ${
              currentMode === mode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
            ${isLoading && mode === TransformationMode.USAnimation ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {mode}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;