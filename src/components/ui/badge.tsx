interface BadgeProps {
  status: string;
}

type ColorKey = "green" | "blue" | "gray" | "red" | "amber";

const STATUS_COLOR_MAP: Record<string, ColorKey> = {
  // Green
  active: "green",
  paid: "green",
  approved: "green",
  "on-track": "green",
  completed: "green",
  // Blue
  scheduled: "blue",
  sent: "blue",
  developing: "blue",
  interview: "blue",
  pending: "blue",
  // Gray
  prospect: "gray",
  draft: "gray",
  "not-started": "gray",
  // Red
  "needs-attention": "red",
  overdue: "red",
  gap: "red",
  cancelled: "red",
  rejected: "red",
  suspended: "red",
  no_show: "red",
};

const COLOR_CLASSES: Record<ColorKey, string> = {
  green: "bg-green-100 text-green-700 border-green-200",
  blue: "bg-teal-50 text-teal border-teal-50",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  red: "bg-accent-light text-accent border-accent-light",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
};

function toDisplayLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Badge({ status }: BadgeProps) {
  const colorKey = STATUS_COLOR_MAP[status.toLowerCase()] ?? "gray";
  const colorClass = COLOR_CLASSES[colorKey];

  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
        colorClass,
      ].join(" ")}
    >
      {toDisplayLabel(status)}
    </span>
  );
}
