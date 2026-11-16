export function BrandLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#0B1B3B" />
      {/* Abstract Briefcase Silhouette */}
      <path
        d="M14.5 13.5V11.5C14.5 10.3954 15.3954 9.5 16.5 9.5H23.5C24.6046 9.5 25.5 10.3954 25.5 11.5V13.5"
        stroke="#06B6D4"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="8.5"
        y="13.5"
        width="23"
        height="17"
        rx="4"
        fill="#1D4ED8"
      />
      {/* Upward Career Growth Step & Arrow */}
      <path
        d="M13 25L18 20L21.5 23L27 17"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 17H27V21"
        stroke="#22D3EE"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
