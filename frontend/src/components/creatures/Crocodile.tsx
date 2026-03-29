export function Crocodile({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 40" fill="none" aria-hidden="true">
      <path
        d="M5 20 L25 18 L30 10 L35 18 L95 15 Q100 15 100 20 Q100 25 95 25 L35 22 L30 30 L25 22 L5 20Z"
        fill="currentColor"
      />
      <circle cx="90" cy="18" r="1.5" fill="currentColor" />
      <path d="M95 17 L100 14 M95 23 L100 26" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
