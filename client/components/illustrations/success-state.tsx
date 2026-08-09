type Props = { size: number };

export function SuccessStateIllustration({ size }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="36" />
      <circle cx="60" cy="60" r="48" opacity="0.2" strokeDasharray="3 4" />
      <path d="M44 62 L 56 74 L 80 48" strokeWidth="3" />
      <circle cx="60" cy="60" r="2" fill="#06A1A0" stroke="none" />
    </svg>
  );
}
