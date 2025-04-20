import React from 'react';
import { FaPlay, FaPause, FaStepForward, FaRedo} from 'react-icons/fa';

interface SimulatorControlsProps {
    onRun: () => void;
    onPause: () => void;
    onStep: () => void;
    onReset: () => void;
    isRunning: boolean;
    isHalted: boolean;
    canStep: boolean;
}

const SimulatorControls: React.FC<SimulatorControlsProps> = ({
    onRun,
    onPause,
    onStep,
    onReset,
    isRunning,
    isHalted,
    canStep,
}) => {
    return (
        <div className="flex space-x-3 mt-4">
            {!isRunning ? (
                <button
                    onClick={onRun}
                    disabled={isHalted}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 flex items-center"
                >
                    <FaPlay className="mr-2" /> Run
                </button>
            ) : (
                <button
                    onClick={onPause}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center"
                >
                    <FaPause className="mr-2" /> Pause
                </button>
            )}
            <button
                onClick={onStep}
                disabled={!canStep}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center"
            >
                <FaStepForward className="mr-2" /> Step
            </button>
             <button
                onClick={onReset}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
            >
                <FaRedo className="mr-2" /> Reset
            </button>
        </div>
    );
};

export default SimulatorControls;