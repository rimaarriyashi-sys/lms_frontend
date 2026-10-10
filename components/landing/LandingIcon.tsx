type LandingIconName =
  | "book"
  | "tasks"
  | "quiz"
  | "grades"
  | "roles"
  | "reports"
  | "check";

const iconPaths: Record<LandingIconName, string[]> = {
  book: [
    "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z",
    "M4 17a2.5 2.5 0 0 1 2.5-2.5H20",
    "M8 7h7M8 10h7",
  ],
  tasks: [
    "m5 7 1.5 1.5L9 6",
    "M12 7h7M5 13l1.5 1.5L9 12",
    "M12 13h7M5 19h14",
  ],
  quiz: [
    "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3",
    "M12 17h.01",
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  ],
  grades: [
    "M4 19V5M4 19h16",
    "m7 14 4-4 3 2 5-6",
    "M16 6h3v3",
  ],
  roles: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  ],
  reports: [
    "M4 19V5M4 19h16",
    "M8 16v-4M12 16V8M16 16v-7",
  ],
  check: ["m5 12 4 4L19 6"],
};

interface LandingIconProps {
  name: LandingIconName;
  className?: string;
}

export type { LandingIconName };

export default function LandingIcon({
  name,
  className = "size-5",
}: LandingIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      {iconPaths[name].map((path) => (
        <path
          d={path}
          key={path}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      ))}
    </svg>
  );
}