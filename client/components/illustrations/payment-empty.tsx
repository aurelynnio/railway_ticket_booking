type Props = { size: number };

export function PaymentEmptyIllustration({ size }: Props) {
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
      <rect x="14" y="32" width="92" height="56" rx="6" />
      <rect x="14" y="40" width="92" height="10" fill="currentColor" stroke="none" opacity="0.85" />
      <rect x="22" y="58" width="14" height="11" rx="1.5" />
      <line x1="22" y1="62" x2="36" y2="62" />
      <line x1="22" y1="65" x2="36" y2="65" />
      <line x1="29" y1="58" x2="29" y2="69" />
      <line x1="42" y1="62" x2="56" y2="62" />
      <line x1="60" y1="62" x2="74" y2="62" />
      <line x1="78" y1="62" x2="92" y2="62" />
      <line x1="22" y1="78" x2="60" y2="78" opacity="0.6" />
      <line x1="80" y1="78" x2="98" y2="78" opacity="0.6" />
      <circle cx="100" cy="84" r="3" fill="#C8161D" stroke="none" />
    </svg>
  );
}
