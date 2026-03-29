export function Frog({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 50" fill="none" aria-hidden="true">
      <path
        d="M10 25 Q5 20 10 15 L15 10 Q20 5 25 8 L30 5 Q35 3 38 8 L42 5 Q48 3 50 10 Q55 8 55 15 Q58 20 55 25 L50 30 Q52 35 48 38 L42 42 Q38 45 35 42 L30 45 Q25 48 22 42 L18 45 Q12 42 10 38 L8 32 Q5 28 10 25Z"
        fill="currentColor"
      />
      <circle cx="22" cy="18" r="2" className="fill-numa-bg" />
      <circle cx="38" cy="18" r="2" className="fill-numa-bg" />
    </svg>
  );
}
