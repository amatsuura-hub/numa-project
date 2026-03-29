export function Owl({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 100" fill="none" aria-hidden="true">
      <path
        d="M40 5 Q32 2 28 8 L25 15 Q18 18 15 25 L12 35 Q10 42 15 48 L18 55 L15 70 Q14 78 18 82 L22 78 Q24 85 28 82 L30 78 Q35 85 40 82 Q45 85 50 78 L52 82 Q56 85 58 78 L62 82 Q66 78 65 70 L62 55 Q68 48 68 42 L65 35 Q62 25 58 18 L55 15 Q52 8 48 5 Q44 2 40 5Z"
        fill="currentColor"
      />
      <circle cx="32" cy="20" r="3" className="fill-numa-bg" />
      <circle cx="48" cy="20" r="3" className="fill-numa-bg" />
      <circle cx="32" cy="20" r="1.5" fill="currentColor" />
      <circle cx="48" cy="20" r="1.5" fill="currentColor" />
      <path d="M36 30 Q40 34 44 30" stroke="currentColor" strokeWidth="1.5" className="fill-none" />
    </svg>
  );
}
