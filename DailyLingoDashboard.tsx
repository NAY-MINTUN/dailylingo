"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnswerState = "idle" | "correct" | "incorrect";

interface AnswerOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  rotate: number;
  color: string;
  delay: number;
}

// ---------------------------------------------------------------------------
// Static puzzle data
// ---------------------------------------------------------------------------

const SCENARIO = "At a Coffee Shop";

const DIALOGUE_LINES: { speaker: string; line: string }[] = [
  { speaker: "Cashier", line: "Hi there! What can I get started for you?" },
  {
    speaker: "Customer",
    line:
      "Hi, I'd like a latte, please. Also, ___________ (make it fast), I'm running late for a meeting.",
  },
];

const ANSWER_OPTIONS: AnswerOption[] = [
  { id: "opt-1", label: "if you can swing it", isCorrect: false },
  { id: "opt-2", label: "step on it", isCorrect: false },
  { id: "opt-3", label: "make it snappy", isCorrect: true },
];

const CONFETTI_COLORS = ["#58CC02", "#FFC800", "#1CB0F6", "#FF4B4B", "#CE82FF"];

// ---------------------------------------------------------------------------
// Confetti burst
// ---------------------------------------------------------------------------

function buildConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 280 - 140,
    rotate: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.15,
  }));
}

function ConfettiBurst({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
          animate={{ opacity: 0, y: 260, x: piece.x, rotate: piece.rotate }}
          transition={{ duration: 1.1, delay: piece.delay, ease: "easeOut" }}
          className="absolute left-1/2 top-8 block h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: piece.color }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top status bar
// ---------------------------------------------------------------------------

function StatusBar({
  day,
  streak,
  progressPercent,
}: {
  day: number;
  streak: number;
  progressPercent: number;
}) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 px-5 pb-4 pt-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[#E5F6FF] px-3 py-1 text-sm font-bold text-[#1CB0F6]">
          Day {day}
        </span>
        <span className="flex items-center gap-1 text-sm font-bold text-[#FF9600]">
          <span aria-hidden="true">🔥</span>
          {streak} day streak
        </span>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
        <motion.div
          className="h-full rounded-full bg-[#58CC02]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogue card
// ---------------------------------------------------------------------------

function DialogueCard() {
  return (
    <div className="rounded-2xl border-2 border-[#E5E5E5] bg-white p-4">
      <p className="mb-3 inline-block rounded-full bg-[#FFF4E5] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#FF9600]">
        {SCENARIO}
      </p>
      <div className="space-y-3">
        {DIALOGUE_LINES.map((entry) => (
          <p key={entry.speaker} className="text-[15px] leading-relaxed text-[#3C3C3C]">
            <span className="font-bold text-[#4B4B4B]">{entry.speaker}: </span>
            {entry.line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback banner (fixed above the answer buttons, Duolingo-style)
// ---------------------------------------------------------------------------

function FeedbackBanner({ state }: { state: AnswerState }) {
  if (state === "idle") return null;

  const isCorrect = state === "correct";

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-2xl border-2 px-4 py-3 text-sm font-bold ${
        isCorrect
          ? "border-[#58CC02] bg-[#D7FFB8] text-[#3C8100]"
          : "border-[#FF4B4B] bg-[#FFDFE0] text-[#EA2B2B]"
      }`}
    >
      {isCorrect ? (
        <span>Nailed it! "Make it snappy" is the natural way to ask someone to hurry.</span>
      ) : (
        <span>Not quite — that phrase doesn't fit here. Give it another shot.</span>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Answer option button
// ---------------------------------------------------------------------------

function AnswerButton({
  option,
  isSelected,
  answerState,
  disabled,
  onSelect,
}: {
  option: AnswerOption;
  isSelected: boolean;
  answerState: AnswerState;
  disabled: boolean;
  onSelect: (option: AnswerOption) => void;
}) {
  const showIncorrect = isSelected && answerState === "incorrect";
  const showCorrect = isSelected && answerState === "correct";

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(option)}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      animate={showIncorrect ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={showIncorrect ? { duration: 0.5 } : { duration: 0.15 }}
      className={`w-full rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] font-bold transition-colors ${
        showCorrect
          ? "border-[#58CC02] bg-[#D7FFB8] text-[#3C8100]"
          : showIncorrect
            ? "border-[#FF4B4B] bg-[#FFDFE0] text-[#EA2B2B]"
            : "border-[#E5E5E5] bg-white text-[#4B4B4B] active:bg-[#F7F7F7]"
      } ${disabled && !isSelected ? "opacity-50" : ""}`}
    >
      {option.label}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export default function DailyLingoDashboard() {
  const [currentDay] = useState<number>(47);
  const [streak, setStreak] = useState<number>(12);
  const [progressPercent, setProgressPercent] = useState<number>(35);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);

  const handleSelectOption = (option: AnswerOption) => {
    if (isPuzzleSolved) return;

    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      setAnswerState("correct");
      setIsPuzzleSolved(true);
      setConfettiPieces(buildConfettiPieces(28));
      setStreak((prev) => prev + 1);
      setProgressPercent((prev) => Math.min(100, prev + 25));
    } else {
      setAnswerState("incorrect");
      // Let the shake play, then reset so the person can try again.
      window.setTimeout(() => {
        setAnswerState("idle");
        setSelectedOptionId(null);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-[#F7F7F7] pb-8">
        <StatusBar day={currentDay} streak={streak} progressPercent={progressPercent} />

        <main className="relative px-5 pt-2">
          <h1 className="mb-4 text-2xl font-extrabold text-[#3C3C3C]">Fill in the blank</h1>

          <div className="relative">
            <DialogueCard />
            <AnimatePresence>
              {isPuzzleSolved && <ConfettiBurst pieces={confettiPieces} />}
            </AnimatePresence>
          </div>

          <div className="mt-6 space-y-3">
            {ANSWER_OPTIONS.map((option) => (
              <AnswerButton
                key={option.id}
                option={option}
                isSelected={selectedOptionId === option.id}
                answerState={selectedOptionId === option.id ? answerState : "idle"}
                disabled={isPuzzleSolved}
                onSelect={handleSelectOption}
              />
            ))}
          </div>

          <div className="mt-5 min-h-[56px]">
            <AnimatePresence mode="wait">
              {selectedOptionId && (
                <FeedbackBanner
                  key={answerState}
                  state={selectedOptionId === "opt-3" ? answerState : answerState}
                />
              )}
            </AnimatePresence>
          </div>

          {isPuzzleSolved && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 w-full rounded-2xl bg-[#58CC02] py-3.5 text-[15px] font-extrabold text-white shadow-[0_4px_0_#4CAD02] active:translate-y-[2px] active:shadow-none"
            >
              Continue
            </motion.button>
          )}
        </main>
      </div>
    </div>
  );
}
