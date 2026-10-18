// Brand link symbols are kept separate from Lucide's interface icon set.
export function Github({ size = 20, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-4 1-4-2-6-3M15 22v-4c0-1-.2-1.6-.7-2.1 3-.4 5.7-1.5 5.7-6.1a4.8 4.8 0 0 0-1.3-3.3c.2-.7.6-2-.2-3.5 0 0-1.1-.3-3.6 1.3a12.8 12.8 0 0 0-6.6 0C5.8 2.7 4.7 3 4.7 3c-.8 1.5-.4 2.8-.2 3.5A4.8 4.8 0 0 0 3.2 9.8c0 4.6 2.7 5.7 5.7 6.1-.5.5-.7 1.1-.7 2.1v4" />
    </svg>
  )
}

export function Linkedin({ size = 20, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="9" width="4" height="12" />
      <circle cx="5" cy="4" r="2" />
      <path d="M11 21V9h4v2c1-2 6-3 6 3v7h-4v-7c0-2-2-2-2 0v7Z" />
    </svg>
  )
}
