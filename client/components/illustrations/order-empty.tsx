type Props = { size: number };

export function OrderEmptyIllustration({ size }: Props) {
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
      <path d="M14 32 H106 V46 C 102 46, 100 48, 100 52 C 100 56, 102 58, 106 58 V88 H14 V58 C 18 58, 20 56, 20 52 C 20 48, 18 46, 14 46 Z" />
      <line x1="60" y1="46" x2="60" y2="88" strokeDasharray="2 3" />
      <line x1="24" y1="40" x2="48" y2="40" strokeWidth="2" />
      <line x1="24" y1="60" x2="52" y2="60" />
      <line x1="24" y1="68" x2="44" y2="68" />
      <line x1="24" y1="76" x2="50" y2="76" />
      <rect x="68" y="58" width="20" height="20" />
      <rect x="71" y="61" width="5" height="5" fill="currentColor" stroke="none" />
      <rect x="80" y="61" width="5" height="5" fill="currentColor" stroke="none" />
      <rect x="71" y="70" width="5" height="5" fill="currentColor" stroke="none" />
      <rect x="80" y="70" width="5" height="5" fill="currentColor" stroke="none" />
      <circle cx="60" cy="52" r="2" fill="#C8161D" stroke="none" />
    </svg>
  );
}
