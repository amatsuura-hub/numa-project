export function Turtle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 50" fill="none" aria-hidden="true">
      <path
        d="M5 30 Q8 25 15 28 L40 25 Q42 15 50 12 Q55 10 58 14 L60 12 Q65 8 68 14 Q72 10 75 15 Q78 12 82 16 L85 25 L110 28 Q115 28 118 32 Q120 36 115 38 L85 36 Q80 40 70 38 L50 40 Q40 42 35 38 L15 36 Q8 38 5 35Z"
        fill="currentColor"
      />
      <circle cx="55" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
