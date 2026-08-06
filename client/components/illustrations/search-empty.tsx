type Props = { size: number };

export function SearchEmptyIllustration({ size }: Props) {
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
      <path d="M10 28 C 28 24, 44 32, 60 30 C 78 28, 92 36, 110 32" />
      <path d="M10 52 C 30 56, 50 50, 70 54 C 88 58, 102 52, 110 56" />
      <path d="M10 78 C 28 82, 50 76, 70 80 C 90 84, 102 80, 110 82" />
      <circle cx="32" cy="36" r="2" fill="currentColor" stroke="none" />
      <circle cx="56" cy="48" r="2" fill="currentColor" stroke="none" />
      <circle cx="82" cy="58" r="2" fill="currentColor" stroke="none" />
      <path d="M32 36 L 56 48 L 82 58" strokeDasharray="2 3" />
      <circle cx="78" cy="78" r="18" />
      <line x1="91" y1="91" x2="104" y2="104" strokeWidth="2.4" />
      <circle cx="78" cy="78" r="11" opacity="0.4" />
      <circle cx="78" cy="78" r="3" fill="#C8161D" stroke="none" />
    </svg>
  );
}
