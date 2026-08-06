type Props = { size: number };

export function TrainEmptyIllustration({ size }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 36 H112" strokeDasharray="2 4" opacity="0.35" />
      <rect x="18" y="44" width="84" height="34" rx="4" />
      <path d="M22 44 C 32 36, 88 36, 98 44" />
      <rect x="28" y="50" width="14" height="12" rx="1.5" />
      <rect x="48" y="50" width="14" height="12" rx="1.5" />
      <rect x="68" y="50" width="14" height="12" rx="1.5" />
      <rect x="86" y="50" width="10" height="20" rx="1" />
      <line x1="91" y1="50" x2="91" y2="70" />
      <circle cx="102" cy="60" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="32" cy="84" r="6" />
      <circle cx="32" cy="84" r="2" />
      <circle cx="88" cy="84" r="6" />
      <circle cx="88" cy="84" r="2" />
      <line x1="10" y1="96" x2="110" y2="96" />
      <line x1="14" y1="102" x2="22" y2="102" />
      <line x1="32" y1="102" x2="40" y2="102" />
      <line x1="50" y1="102" x2="58" y2="102" />
      <line x1="68" y1="102" x2="76" y2="102" />
      <line x1="86" y1="102" x2="94" y2="102" />
      <circle cx="60" cy="60" r="1.5" fill="#C8161D" stroke="none" />
    </svg>
  );
}
