import React from 'react';
import { Tape, BLANK_SYMBOL } from "@/app/lib/turingMachine";

interface TapeDisplayProps {
    tape: Tape;
    headPosition: number;
}

const TapeDisplay: React.FC<TapeDisplayProps> = ({ tape, headPosition }) => {
    return (
        <div className="bg-gray-100 p-4 rounded overflow-x-auto whitespace-nowrap font-mono text-lg border border-gray-300 shadow-inner min-h-[5rem] flex items-center">
            {tape.map((symbol, index) => (
                <div
                    key={index}
                    className={`inline-flex items-center justify-center w-10 h-10 border border-gray-400 relative mx-0.5 ${index === headPosition ? 'bg-yellow-300 font-bold' : 'bg-white'
                        }`}
                >
                    {symbol === BLANK_SYMBOL ? <span className="text-gray-400 italic">b</span> : symbol}
                    {index === headPosition && (
                        <div className="absolute -bottom-4 text-xl text-yellow-600">▼</div>
                    )}
                </div>
            ))}
             {tape.length === 0 && (
                 <div className="inline-flex items-center justify-center w-10 h-10 border border-gray-400 relative mx-0.5 bg-white italic text-gray-400">b</div>
             )}
        </div>
    );
};

export default TapeDisplay;