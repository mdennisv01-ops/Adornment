'use client';

const paths = {
  search: <><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  account: <><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.3-4 2.7-6 6.5-6s6.2 2 6.5 6"/></>,
  bag: <><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  heart: <path d="M20.4 4.6a5.5 5.5 0 0 0-7.8 0L12 5.2l-.6-.6a5.5 5.5 0 0 0-7.8 7.8l.6.6L12 21l7.8-8a5.5 5.5 0 0 0 .6-8.4Z"/>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor" stroke="none"/>,
  arrow: <><path d="M5 19 19 5M9 5h10v10"/></>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
  chevronRight: <path d="m9 5 6 7-6 7"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  check: <path d="m5 12 4 4L19 7"/>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  box: <><path d="M4 7h16v13H4z"/><path d="M8 7V4h8v3M8 12h8"/></>,
  receipt: <><path d="M6 3v18l3-2 3 2 3-2 3 2V3l-3 2-3-2-3 2-3-2Z"/><path d="M9 9h6M9 13h6"/></>,
  user: <><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.3-4 2.7-6 6.5-6s6.2 2 6.5 6"/></>,
  logout: <><path d="M10 4H4v16h6M15 8l4 4-4 4M19 12H8"/></>,
};

export default function Icon({ name, size = 20, className = '', ...props }) {
  return (
    <svg
      className={`icon icon-${name} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || null}
    </svg>
  );
}
