/**
 * SVG mark for favicon, navbar, and auth screens.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="40" height="40" rx="10" className="fill-primary-600" />
      <path
        d="M11 13h10.5a4.5 4.5 0 0 1 0 9H14.5L10 28V22.5H11a4.5 4.5 0 0 1 0-9Z"
        stroke="white"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M23.5 15H30M23.5 20H29"
        stroke="#bae6fd"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
