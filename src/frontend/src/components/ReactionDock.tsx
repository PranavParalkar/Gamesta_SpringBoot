import React from "react";
import { motion } from "framer-motion";

const reactions = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "HAHA", emoji: "😂", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Sad" },
  { type: "ANGRY", emoji: "😡", label: "Angry" },
];

interface ReactionDockProps {
  onSelect: (type: string) => void;
  currentReaction?: string | null;
}

export default function ReactionDock({ onSelect, currentReaction }: ReactionDockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-full shadow-xl flex items-center gap-2 z-50 border border-gray-100"
    >
      {reactions.map((r) => (
        <motion.button
          key={r.type}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(r.type);
          }}
          whileHover={{ scale: 1.5, y: -5 }}
          whileTap={{ scale: 0.9 }}
          className={`text-2xl relative group transition-all ${
            currentReaction === r.type ? "grayscale-0 scale-125" : "grayscale hover:grayscale-0"
          }`}
          title={r.label}
        >
          {r.emoji}
          {/* Tooltip */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {r.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
