# Maestro — Educational Chess

Frontend-only chess coach. Learn tactics through staged puzzles, then play a full game against a computer opponent. Every move is gated by `chess.js` — illegal moves never appear on the board.

## Stack

- React 19 + Vite
- Tailwind CSS
- Framer Motion
- `chess.js` for rules and game state
- `react-chessboard` for the animated board
- In-browser minimax + heuristic eval (easy / medium / hard)

No server, no accounts, no payments. Progress lives in `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

```bash
npm test
npm run build
npm run preview
```

## How to use

- **Stages** — forks, pins, skewers, discovered attacks, middlegame motifs, then endgame basics. Each card has a goal, a FEN, success/fail feedback, and a hint.
- **vs Computer** — you play White by default (or Black / flip). The engine thinks briefly, then animates a legal reply. Undo rewinds a pair of moves.
- **Free play** — both sides on one board, still strict turns.
- **Click** a piece of the side to move to glow every legal square, then click or drag.
- **Coach Mode** pulses red on pieces that are under attack and explains ideas after each move (free play and vs computer).
- **Arrows:** right-drag on desktop. On a phone, tap **Arrows**, then two squares.
- **Hint** draws a suggested move; **Play hint** makes it. **H** on the keyboard also requests a hint. **Esc** clears a selection.
- Language toggle **עב / EN** (Hebrew is the default; the board stays LTR). Sound is optional.

## Notes

This repository previously hosted a booking demo (Flow). That product has been replaced. The default Vite app *is* Maestro.
