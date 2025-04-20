'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import TapeDisplay from '@/app/components/TapeDisplay';
import SimulatorControls from '@/app/components/SimulatorControls';
import {
    TuringMachineState,
    Transitions,
    parseTransitions,
    initializeTape,
    step,
    BLANK_SYMBOL,
} from '@/app/lib/turingMachine';

const DEFAULT_TRANSITIONS = `
// Example transitions for a simple Turing machine
// This machine flips 1s to 0s and halts on blank
(q0, 1) -> (q1, 0, R)
(q0, 0) -> (q1, 1, R)
(q1, 1) -> (q0, 0, R)
(q1, 0) -> (q0, 1, R)
(q1, ${BLANK_SYMBOL}) -> (halt-accept, ${BLANK_SYMBOL}, S)
(q0, ${BLANK_SYMBOL}) -> (halt-accept, ${BLANK_SYMBOL}, S)
`.trim();
const DEFAULT_INITIAL_TAPE = '1011';
const DEFAULT_INITIAL_STATE = 'q0';
const HALT_STATES = new Set(['halt-accept', 'halt-reject', 'q2']);


export default function Home() {
    const [initialTapeInput, setInitialTapeInput] = useState(DEFAULT_INITIAL_TAPE);
    const [initialStateInput, setInitialStateInput] = useState(DEFAULT_INITIAL_STATE);
    const [transitionsInput, setTransitionsInput] = useState(DEFAULT_TRANSITIONS);
    const [parsedTransitions, setParsedTransitions] = useState<Transitions | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);

    const [tmState, setTmState] = useState<TuringMachineState>(() => {
        const startState = DEFAULT_INITIAL_STATE;
        return {
            tape: initializeTape(DEFAULT_INITIAL_TAPE),
            headPosition: 0,
            currentState: startState,
            steps: 0,
            isHalted: HALT_STATES.has(startState),
            status: 'idle',
            message: 'Ready. Parse transitions to begin.',
        };
    });

    const [isRunning, setIsRunning] = useState(false);
    const runIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [simulationSpeed, setSimulationSpeed] = useState(200);

    const clearSimulationInterval = useCallback((logContext: string) => {
        const intervalId = runIntervalRef.current;
        if (intervalId !== null) {
            clearInterval(intervalId);
            runIntervalRef.current = null;
        }
    }, []);

    const handleParseTransitions = useCallback(() => {
        setParseError(null);
        const result = parseTransitions(transitionsInput);
        if (result.error) {
            setParseError(result.error);
            setParsedTransitions(null);
            setTmState(prev => ({...prev, status: 'error', message: `Parse Error: ${result.error}`}));
        } else {
            setParsedTransitions(result.transitions);
            setTmState(prev => ({ ...prev, message: `Transitions parsed (${result.transitions.size} rules). Press Reset or Run.` }));
        }
    }, [transitionsInput]);

    useEffect(() => {
        handleParseTransitions();
    }, []);

    const performStep = useCallback(() => {
        setTmState(currentTmState => {
            if (currentTmState.isHalted || !parsedTransitions) {
                if (runIntervalRef.current !== null) {
                   clearSimulationInterval("performStep - Stop Condition Met");
                }
                return currentTmState;
            }

            const result = step(
                currentTmState.currentState,
                currentTmState.tape,
                currentTmState.headPosition,
                parsedTransitions,
                HALT_STATES
            );

            if (result) {
                const isNowHalted = HALT_STATES.has(result.nextState);
                if (isNowHalted && runIntervalRef.current !== null) {
                    clearSimulationInterval("performStep - Halted Result");
                }
                return {
                    tape: result.newTape,
                    headPosition: result.newHeadPosition,
                    currentState: result.nextState,
                    steps: currentTmState.steps + 1,
                    isHalted: isNowHalted,
                    status: result.status,
                    message: result.message,
                };
            } else {
                 if (runIntervalRef.current !== null) {
                    clearSimulationInterval("performStep - Null Result");
                 }
                return {
                    tape: currentTmState.tape,
                    headPosition: currentTmState.headPosition,
                    currentState: currentTmState.currentState,
                    steps: currentTmState.steps,
                    isHalted: true,
                    status: currentTmState.currentState.toLowerCase().includes('accept') ? 'halted-accept' : 'halted-reject',
                    message: `Already halted: State "${currentTmState.currentState}" is a halt state.`,
                };
            }
        });
    }, [parsedTransitions, clearSimulationInterval]);

     useEffect(() => {
         if (tmState.isHalted && isRunning) {
             if (runIntervalRef.current !== null) {
                  clearSimulationInterval("Effect[isHalted]");
             }
             setIsRunning(false);
         }
     }, [tmState.isHalted, isRunning, clearSimulationInterval]);


    const handleRun = useCallback(() => {
        if (isRunning || tmState.isHalted || parseError || !parsedTransitions) {
            return;
        }
        clearSimulationInterval("handleRun - Precautionary Clear");
        setIsRunning(true);
        setTmState(prev => ({ ...prev, status: 'running', message: 'Running...' }));

        const newIntervalId = setInterval(performStep, simulationSpeed);
        runIntervalRef.current = newIntervalId;

    }, [isRunning, tmState.isHalted, parseError, parsedTransitions, simulationSpeed, performStep, clearSimulationInterval]);


    const handlePause = useCallback(() => {
        if (!isRunning) return;
        clearSimulationInterval("handlePause");
        setIsRunning(false);
        setTmState(prev => (!prev.isHalted ? { ...prev, status: 'idle', message: 'Paused.' } : prev));
    }, [isRunning, clearSimulationInterval]);


    const handleStep = useCallback(() => {
        if (isRunning || tmState.isHalted || parseError || !parsedTransitions) {
            return;
        }
        clearSimulationInterval("handleStep - Precaution");
        setIsRunning(false);
        performStep();
    }, [isRunning, tmState.isHalted, parseError, parsedTransitions, performStep, clearSimulationInterval]);


    const handleReset = useCallback(() => {
        clearSimulationInterval("handleReset");
        setIsRunning(false);

        const tape = initializeTape(initialTapeInput);
        const startState = initialStateInput || DEFAULT_INITIAL_STATE;
        setTmState({
            tape: tape,
            headPosition: 0,
            currentState: startState,
            steps: 0,
            isHalted: HALT_STATES.has(startState),
            status: 'idle',
            message: 'Reset to initial configuration. Ready.',
        });

    }, [initialTapeInput, initialStateInput, clearSimulationInterval]);


    useEffect(() => {
        return () => {
            clearSimulationInterval("Unmount Cleanup");
        };
    }, [clearSimulationInterval]);

    return (
        <main className="container mx-auto p-4 md:p-8 font-sans">
            <h1 className="text-3xl font-bold mb-6 text-center text-pink-200">
                Turing Machine Simulator
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-stone-100 p-4 rounded shadow border border-gray-200">
                    <label htmlFor="transitions" className="block text-lg font-semibold mb-2 text-gray-700">
                        Transition Rules
                    </label>
                     <p className="text-sm text-gray-500 mb-2">Format: (currentState, readSymbol) {'->'} (nextState, writeSymbol, Move[L/R/S])</p>
                    <textarea
                        id="transitions"
                        value={transitionsInput}
                        onChange={(e) => setTransitionsInput(e.target.value)}
                        onBlur={handleParseTransitions}
                        rows={10}
                        className={`w-full p-2 border rounded font-mono text-sm text-gray-700 ${parseError ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-400 focus:outline-none`}
                        placeholder="(q0, 1) -> (q1, 0, R)"
                    />
                    {parseError && (
                        <p className="text-red-600 text-sm mt-2">{parseError}</p>
                    )}
                    {!parseError && parsedTransitions && (
                         <p className="text-green-600 text-sm mt-2">Transitions parsed successfully ({parsedTransitions.size} rules).</p>
                     )}
                     {!parseError && !parsedTransitions && (
                         <p className="text-gray-500 text-sm mt-2">Enter transitions and click out to parse.</p>
                      )}
                </div>
                <div className="text-gray-500 bg-stone-100 p-4 rounded shadow border border-gray-200 flex flex-col justify-between">
                    <div>
                        <label htmlFor="initialTape" className="block text-lg font-semibold mb-2 text-gray-700">
                            Initial Tape Content
                        </label>
                        <input
                            type="text" id="initialTape" value={initialTapeInput}
                            onChange={(e) => setInitialTapeInput(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4 font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            placeholder={`e.g., ${DEFAULT_INITIAL_TAPE}`}
                        />
                        <label htmlFor="initialState" className="block text-lg font-semibold mb-2 text-gray-700">
                            Initial State
                        </label>
                        <input
                            type="text" id="initialState" value={initialStateInput}
                            onChange={(e) => setInitialStateInput(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            placeholder={`e.g., ${DEFAULT_INITIAL_STATE}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1">Simulation Speed (ms/step)</label>
                        <input
                            type="range" id="speed" min="10" max="1000" step="10" value={simulationSpeed}
                            onChange={(e) => {
                                const newSpeed = Number(e.target.value);
                                setSimulationSpeed(newSpeed);
                                if (isRunning && runIntervalRef.current) {
                                     clearSimulationInterval("Speed Change");
                                     const newIntervalId = setInterval(performStep, newSpeed);
                                     runIntervalRef.current = newIntervalId;
                                }
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <span className="text-sm text-gray-600 block text-center">{simulationSpeed} ms</span>
                    </div>
                </div>
            </div>
            <div className="bg-stone-100 p-6 rounded shadow border border-gray-200">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Simulation</h2>
                <div className="text-gray-500 flex flex-wrap justify-between items-center mb-4 bg-gray-50 p-3 rounded border border-gray-200 gap-y-2 gap-x-4">
                    <div> State: <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${tmState.isHalted ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{tmState.currentState}</span> </div>
                    <div> Steps: <span className="ml-2 font-mono text-gray-800">{tmState.steps}</span> </div>
                    <div> Status: <span className={`ml-2 px-2 py-1 rounded text-sm font-medium capitalize ${
                            isRunning ? 'bg-yellow-100 text-yellow-800' :
                            tmState.status.includes('halted-accept') ? 'bg-green-100 text-green-800' :
                            tmState.status.includes('halted-reject') ? 'bg-red-100 text-red-800' :
                            tmState.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                         }`}>{isRunning ? 'Running' : tmState.status.replace('-', ' ')}</span>
                    </div>
                </div>
                <div className="text-gray-500 mb-4"> <TapeDisplay tape={tmState.tape} headPosition={tmState.headPosition} /> </div>
                <div className="mb-4 min-h-[2em]"> <p className="text-sm text-gray-600 italic">{tmState.message || '\u00A0'}</p> </div>
                <SimulatorControls
                    onRun={handleRun}
                    onPause={handlePause}
                    onStep={handleStep}
                    onReset={handleReset}
                    isRunning={isRunning}
                    isHalted={tmState.isHalted}
                    canStep={!isRunning && !tmState.isHalted && !parseError && !!parsedTransitions}
                />
            </div>
        </main>
    );
}