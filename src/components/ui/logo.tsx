import type { SVGProps } from "react";

export function Logo({
  className = "h-6 w-6 text-emerald-400",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Outer perimeter calipers (Cryptographic Keyway Gate) */}
      <path
        d="M 2 12 L 2 2 L 12 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M 30 12 L 30 2 L 20 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M 2 20 L 2 30 L 12 30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <path
        d="M 30 20 L 30 30 L 20 30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />

      {/* Central nested cipher vault core */}
      <rect
        x="10"
        y="10"
        width="12"
        height="12"
        stroke="currentColor"
        strokeWidth="1.75"
      />

      {/* Verified anchor node */}
      <rect x="14.5" y="14.5" width="3" height="3" fill="currentColor" />

      {/* Vertical cryptographic alignment hairlines */}
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.8"
      />
      <line
        x1="16"
        y1="25"
        x2="16"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.8"
      />
    </svg>
  );
}
