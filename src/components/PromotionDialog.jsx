import { motion } from "framer-motion";

const CHOICES = [
  { piece: "q", key: "queen", glyph: { w: "♕", b: "♛" } },
  { piece: "r", key: "rook", glyph: { w: "♖", b: "♜" } },
  { piece: "b", key: "bishop", glyph: { w: "♗", b: "♝" } },
  { piece: "n", key: "knight", glyph: { w: "♘", b: "♞" } },
];

export default function PromotionDialog({ t, color, onPick, onCancel }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 grid place-items-center bg-black/55 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-panel w-[min(18rem,90%)] rounded-2xl p-4"
      >
        <p className="mb-3 text-center text-sm font-semibold text-white">{t("promote")}</p>
        <div className="grid grid-cols-4 gap-2">
          {CHOICES.map((choice) => (
            <button
              key={choice.piece}
              type="button"
              onClick={() => onPick(choice.piece)}
              className="glow-cyan rounded-xl border border-white/10 bg-white/5 py-3 text-3xl"
              aria-label={t(choice.key)}
            >
              {choice.glyph[color]}
            </button>
          ))}
        </div>
        <button type="button" onClick={onCancel} className="mt-3 w-full text-xs text-white/45">
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
}
