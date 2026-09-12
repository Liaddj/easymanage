# Maestro — Educational Chess

Frontend-only chess coach. Play both sides on one board, see legal moves and threats, and get a short lesson after every move. No server, no accounts, no payments.

## Stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion
- `chess.js` for rules and game state
- `react-chessboard` for the animated board

Everything runs in the browser. Evaluation is a material + center + development heuristic — not a chess engine.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

```bash
npm run build
npm run preview
```

## How to use

- **Click** a piece to glow every legal square, then click (or drag) to move.
- **Coach Mode** pulses red on pieces that are under attack and writes a short explanation after each move. The evaluation bar is a simulated White/Black advantage meter.
- **Arrows:** right-drag on desktop. On a phone, tap **Arrows**, then two squares. The coach also draws plan / check arrows.
- **Hint** draws a suggested move; **Play hint** makes it.
- **Undo / Redo / Reset / Flip** are in the control dock.
- Language toggle **עב / EN** (Hebrew is the default; the board stays LTR).

## Notes

This repository previously hosted a booking demo (Flow). That product has been replaced. The default Vite app *is* Maestro.
