# React Turing Machine Simulator

A simple web-based simulator for Turing machines built with React and TypeScript.

## Features

*   Visualize the tape and head movement.
*   Define custom transition rules.
*   Set initial tape content and state.
*   Run, Step, Pause, and Reset the simulation.
*   Adjustable execution speed.

## Quick Start

1.  **Clone:** `git clone <repository-url>`
2.  **Install:** `cd <directory> && npm install`
3.  **Run:** `npm run dev`
4.  Open `http://localhost:3000`

## How to Use

1.  Enter **Transition Rules** (format: `(current, read) -> (next, write, Move[L/R/S])`).
2.  Enter **Initial Tape** content.
3.  Enter **Initial State**.
4.  Use the **Run/Pause/Step/Reset** buttons to control the simulation.