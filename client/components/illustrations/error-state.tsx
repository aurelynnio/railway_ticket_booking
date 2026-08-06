type Props = { size: number };

export function ErrorStateIllustration({ size }: Props) {
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
      <path d="M60 20 L 102 92 H 18 Z" strokeWidth="1.8" />
      <path d="M60 30 L 92 86 H 28 Z" opacity="0.25" />
      <line x1="60" y1="48" x2="60" y2="70" strokeWidth="3" />
      <circle cx="60" cy="80" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
