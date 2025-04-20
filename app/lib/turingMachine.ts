export type Tape = string[];
export type MoveDirection = 'L' | 'R' | 'H';

export interface Transition {
    nextState: string;
    writeSymbol: string;
    move: MoveDirection;
}

export type Transitions = Map<string, Transition>;

export interface TuringMachineState {
    tape: Tape;
    headPosition: number;
    currentState: string;
    steps: number;
    isHalted: boolean;
    status: 'running' | 'halted-accept' | 'halted-reject' | 'error' | 'idle';
    message: string;
}

export const BLANK_SYMBOL = 'b';

export function parseTransitions(text: string): { transitions: Transitions; error?: string } {
    const transitions: Transitions = new Map();
    const lines = text.trim().split('\n');
    const regex = /^\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*->\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([LRS])\s*\)\s*$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('//') || line.startsWith('#')) {
            continue;
        }

        const match = line.match(regex);
        if (!match) {
            return { transitions, error: `Invalid transition format on line ${i + 1}: "${line}"` };
        }

        const [, currentState, readSymbol, nextState, writeSymbol, move] = match;

        if (readSymbol.length !== 1) {
             return { transitions, error: `Read symbol must be a single character on line ${i + 1}: "${readSymbol}"` };
        }
         if (writeSymbol.length !== 1) {
             return { transitions, error: `Write symbol must be a single character on line ${i + 1}: "${writeSymbol}"` };
        }

        const key = `${currentState},${readSymbol}`;
        if (transitions.has(key)) {
             return { transitions, error: `Duplicate transition key on line ${i + 1}: (${currentState}, ${readSymbol})` };
        }

        transitions.set(key, {
            nextState: nextState.trim(),
            writeSymbol: writeSymbol.trim(),
            move: move as MoveDirection,
        });
    }

    return { transitions };
}


export function initializeTape(input: string): Tape {
    if (!input) return [BLANK_SYMBOL];
    return input.split('');
}

export function step(
    currentState: string,
    tape: Tape,
    headPosition: number,
    transitions: Transitions,
    haltStates: Set<string>
): {
    nextState: string;
    newTape: Tape;
    newHeadPosition: number;
    status: TuringMachineState['status'];
    message: string;
 } | null {

    if (haltStates.has(currentState)) {
       return null;
    }

    const currentTape = [...tape];
    while (headPosition < 0) {
        currentTape.unshift(BLANK_SYMBOL);
        headPosition++;
    }
     while (headPosition >= currentTape.length) {
        currentTape.push(BLANK_SYMBOL);
    }

    const readSymbol = currentTape[headPosition];
    const transitionKey = `${currentState},${readSymbol}`;
    const transition = transitions.get(transitionKey);

    if (!transition) {
        return {
            nextState: currentState,
            newTape: currentTape,
            newHeadPosition: headPosition,
            status: 'halted-reject',
            message: `Halted (Reject): No transition found for state "${currentState}" and symbol "${readSymbol}".`,
        };
    }

    currentTape[headPosition] = transition.writeSymbol;

    let newHeadPosition = headPosition;
    if (transition.move === 'L') {
        newHeadPosition--;
    } else if (transition.move === 'R') {
        newHeadPosition++;
    }

    while (newHeadPosition < 0) {
        currentTape.unshift(BLANK_SYMBOL);
        newHeadPosition++;
    }
     while (newHeadPosition >= currentTape.length) {
        currentTape.push(BLANK_SYMBOL);
    }

    const nextState = transition.nextState;
    let newStatus: TuringMachineState['status'] = 'running';
    let message = `Step: Read '${readSymbol}', Write '${transition.writeSymbol}', Move ${transition.move}`;

    if (haltStates.has(nextState)) {
        newStatus = nextState.toLowerCase().includes('accept') ? 'halted-accept' : 'halted-reject';
        message = `Halted (${newStatus.split('-')[1]}): Reached halt state "${nextState}".`;
    }

    return {
        nextState: nextState,
        newTape: currentTape,
        newHeadPosition: newHeadPosition,
        status: newStatus,
        message: message,
    };
}