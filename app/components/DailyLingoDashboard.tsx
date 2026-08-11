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

interface DialogueLine {
  speaker: string;
  line: string;
}

interface Puzzle {
  scenario: string;
  dialogue: DialogueLine[];
  options: AnswerOption[];
  explanation: string;
}

interface ConfettiPiece {
  id: number;
  x: number;
  rotate: number;
  color: string;
  delay: number;
}

// ---------------------------------------------------------------------------
// Pastel palette (used inline where Tailwind's default scale doesn't reach)
// ---------------------------------------------------------------------------

const PALETTE = {
  bg: "#FBF7FF",
  cardBorder: "#E8DFFF",
  correctBg: "#DFFFEA",
  correctBorder: "#8FE3B0",
  correctText: "#3F9A63",
  incorrectBg: "#FFE3EC",
  incorrectBorder: "#FFAFC5",
  incorrectText: "#D96284",
  streakBg: "#FFF1DA",
  streakText: "#E29D4B",
  dayBg: "#E0F3FF",
  dayText: "#4A90C2",
  scenarioBg: "#F3ECFF",
  scenarioText: "#8B6FE0",
  progressStart: "#C9B6FF",
  progressEnd: "#FFB6D9",
  primaryButton: "#C9B6FF",
  primaryButtonShadow: "#A78BFA",
};

const CONFETTI_COLORS = ["#C9B6FF", "#FFB6D9", "#8FE3B0", "#FFD9B3", "#AEE2FF"];

// ---------------------------------------------------------------------------
// Puzzle pool — the "infinite levels" pool. Once every puzzle in the pool
// has been played, the pool reshuffles so the game never runs out.
// ---------------------------------------------------------------------------

const PUZZLE_POOL: Puzzle[] = [
  {
    scenario: "At a Coffee Shop",
    dialogue: [
      { speaker: "Cashier", line: "Hi there! What can I get started for you?" },
      {
        speaker: "Customer",
        line:
          "Hi, I'd like a latte, please. Also, ___________ (make it fast), I'm running late for a meeting.",
      },
    ],
    options: [
      { id: "opt-1", label: "if you can swing it", isCorrect: false },
      { id: "opt-2", label: "step on it", isCorrect: false },
      { id: "opt-3", label: "make it snappy", isCorrect: true },
    ],
    explanation: "Nailed it! \"Make it snappy\" is the natural way to ask someone to hurry.",
  },
  {
    scenario: "Catching a Train",
    dialogue: [
      { speaker: "Friend", line: "The train leaves in three minutes, we need to go!" },
      {
        speaker: "You",
        line: "Okay, ___________ (let's leave immediately), we can't miss this one.",
      },
    ],
    options: [
      { id: "opt-1", label: "let's take our time", isCorrect: false },
      { id: "opt-2", label: "let's get a move on", isCorrect: true },
      { id: "opt-3", label: "let's sit tight", isCorrect: false },
    ],
    explanation: "Exactly! \"Let's get a move on\" means let's hurry up and go now.",
  },
  {
    scenario: "Ordering Food Online",
    dialogue: [
      { speaker: "App Chat", line: "Your order is ready, would you like anything else?" },
      {
        speaker: "You",
        line: "No thanks, ___________ (that's everything), just the delivery please.",
      },
    ],
    options: [
      { id: "opt-1", label: "that's the ticket", isCorrect: false },
      { id: "opt-2", label: "that'll do it", isCorrect: true },
      { id: "opt-3", label: "that's a wrap party", isCorrect: false },
    ],
    explanation: "Right! \"That'll do it\" is a casual way to say your order is complete.",
  },
  {
    scenario: "Meeting a Deadline",
    dialogue: [
      { speaker: "Manager", line: "How's the report coming along? It's due today." },
      {
        speaker: "You",
        line: "Don't worry, I'm ___________ (almost finished) — just need ten more minutes.",
      },
    ],
    options: [
      { id: "opt-1", label: "starting from scratch", isCorrect: false },
      { id: "opt-2", label: "putting it off", isCorrect: false },
      { id: "opt-3", label: "wrapping it up", isCorrect: true },
    ],
    explanation: "Correct! \"Wrapping it up\" means you're finishing the last bit of something.",
  },
  {
    scenario: "Small Talk at a Party",
    dialogue: [
      { speaker: "Host", line: "Glad you could make it! How do you know the birthday girl?" },
      {
        speaker: "You",
        line: "We ___________ (became friends) back in college and stayed close ever since.",
      },
    ],
    options: [
      { id: "opt-1", label: "hit it off", isCorrect: true },
      { id: "opt-2", label: "fell behind", isCorrect: false },
      { id: "opt-3", label: "called it off", isCorrect: false },
    ],
    explanation: "That's it! \"Hit it off\" means two people got along well right away.",
  },
  {
    scenario: "Returning a Purchase",
    dialogue: [
      { speaker: "Store Clerk", line: "Is there anything wrong with the item?" },
      {
        speaker: "Customer",
        line: "It's fine, I just ___________ (changed my mind) about the color.",
      },
    ],
    options: [
      { id: "opt-1", label: "had a change of heart", isCorrect: true },
      { id: "opt-2", label: "gave it a shot", isCorrect: false },
      { id: "opt-3", label: "kept my word", isCorrect: false },
    ],
    explanation: "Yes! \"Had a change of heart\" means you decided differently than before.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 280 - 140,
    rotate: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.15,
  }));
}

// ---------------------------------------------------------------------------
// Confetti burst
// ---------------------------------------------------------------------------

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
  level,
  progressPercent,
}: {
  level: number;
  progressPercent: number;
}) {
  return (
    <div
      className="sticky top-0 z-10 px-5 pb-4 pt-6 backdrop-blur"
      style={{ backgroundColor: `${PALETTE.bg}E6` }}
    >
      

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#EFEAFB]">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.progressStart}, ${PALETTE.progressEnd})`,
          }}
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

function DialogueCard({ puzzle }: { puzzle: Puzzle }) {
  return (
    <div
      className="rounded-2xl border-2 bg-white p-4"
      style={{ borderColor: PALETTE.cardBorder }}
    >
      <p
        className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
        style={{ backgroundColor: PALETTE.scenarioBg, color: PALETTE.scenarioText }}
      >
        {puzzle.scenario}
      </p>
      <div className="space-y-3">
        {puzzle.dialogue.map((entry) => (
          <p key={entry.speaker} className="text-[15px] leading-relaxed text-[#5B5570]">
            <span className="font-bold text-[#3F3A54]">{entry.speaker}: </span>
            {entry.line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback banner
// ---------------------------------------------------------------------------

function FeedbackBanner({ state, explanation }: { state: AnswerState; explanation: string }) {
  if (state === "idle") return null;

  const isCorrect = state === "correct";

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-2xl border-2 px-4 py-3 text-sm font-bold"
      style={
        isCorrect
          ? {
              borderColor: PALETTE.correctBorder,
              backgroundColor: PALETTE.correctBg,
              color: PALETTE.correctText,
            }
          : {
              borderColor: PALETTE.incorrectBorder,
              backgroundColor: PALETTE.incorrectBg,
              color: PALETTE.incorrectText,
            }
      }
    >
      {isCorrect ? explanation : "Not quite — that phrase doesn't fit here. Give it another shot."}
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

  const style = showCorrect
    ? {
        borderColor: PALETTE.correctBorder,
        backgroundColor: PALETTE.correctBg,
        color: PALETTE.correctText,
      }
    : showIncorrect
      ? {
          borderColor: PALETTE.incorrectBorder,
          backgroundColor: PALETTE.incorrectBg,
          color: PALETTE.incorrectText,
        }
      : {
          borderColor: PALETTE.cardBorder,
          backgroundColor: "#FFFFFF",
          color: "#4B4560",
        };

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(option)}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      animate={showIncorrect ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={showIncorrect ? { duration: 0.5 } : { duration: 0.15 }}
      className={`w-full rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] font-bold transition-colors ${
        disabled && !isSelected ? "opacity-50" : ""
      }`}
      style={style}
    >
      {option.label}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export default function DailyLingoDashboard() {
  const [queue, setQueue] = useState<Puzzle[]>(() => shuffleArray(PUZZLE_POOL));
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(35);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);

  const currentPuzzle = queue[queueIndex];

  const handleSelectOption = (option: AnswerOption) => {
    if (isPuzzleSolved) return;

    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      setAnswerState("correct");
      setIsPuzzleSolved(true);
      setConfettiPieces(buildConfettiPieces(28));
      setProgressPercent((prev) => (prev + 25 >= 100 ? 100 : prev + 25));
    } else {
      setAnswerState("incorrect");
      window.setTimeout(() => {
        setAnswerState("idle");
        setSelectedOptionId(null);
      }, 600);
    }
  };

  const handleContinue = () => {
    const nextIndex = queueIndex + 1;

    // Infinite levels: once the shuffled pool runs out, reshuffle it again
    // so the same scenarios can resurface in a fresh order.
    if (nextIndex >= queue.length) {
      setQueue(shuffleArray(PUZZLE_POOL));
      setQueueIndex(0);
    } else {
      setQueueIndex(nextIndex);
    }

    setLevel((prev) => prev + 1);
    setProgressPercent((prev) => (prev >= 100 ? 25 : prev));
    setSelectedOptionId(null);
    setAnswerState("idle");
    setConfettiPieces([]);
    setIsPuzzleSolved(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: PALETTE.bg }}>
      <div
        className="relative mx-auto min-h-screen w-full max-w-md pb-8"
        style={{ backgroundColor: PALETTE.bg }}
      >
        

        <main className="relative px-5 pt-2">
          <h1 className="mb-4 text-2xl font-extrabold text-[#3F3A54]">Fill in the blank</h1>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${level}-${currentPuzzle.scenario}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <DialogueCard puzzle={currentPuzzle} />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence>
              {isPuzzleSolved && <ConfettiBurst pieces={confettiPieces} />}
            </AnimatePresence>
          </div>

          <div className="mt-6 space-y-3">
            {currentPuzzle.options.map((option) => (
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
                  state={answerState}
                  explanation={currentPuzzle.explanation}
                />
              )}
            </AnimatePresence>
          </div>

          {isPuzzleSolved && (
            <motion.button
              type="button"
              onClick={handleContinue}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 w-full rounded-2xl py-3.5 text-[15px] font-extrabold text-white"
              style={{
                backgroundColor: PALETTE.primaryButton,
                boxShadow: `0 4px 0 ${PALETTE.primaryButtonShadow}`,
              }}
            >
              Continue
            </motion.button>
          )}
        </main>
      </div>
    </div>
  );
}
