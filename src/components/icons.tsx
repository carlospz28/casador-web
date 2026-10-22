type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const BagIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const MenuIcon = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ShieldIcon = ({ className = "size-7" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.3}>
    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const TruckIcon = ({ className = "size-7" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.3}>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
);

export const ReturnIcon = ({ className = "size-7" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.3}>
    <path d="M4 12a8 8 0 0 1 14-5" />
    <path d="M18 3v4h-4" />
    <path d="M20 12a8 8 0 0 1-14 5" />
    <path d="M6 21v-4h4" />
  </svg>
);

export const LockIcon = ({ className = "size-7" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.3}>
    <rect x="4" y="10" width="16" height="11" rx="1" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const GiftIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={1.3}>
    <rect x="3" y="8" width="18" height="13" />
    <path d="M3 12h18M12 8v13" />
    <path d="M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1" />
  </svg>
);
