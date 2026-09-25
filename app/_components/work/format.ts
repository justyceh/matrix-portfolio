// Fixed names, not Intl — identical output on server and client (no hydration drift).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-05" → "May 2025"; "present" → "Present" */
export function formatMonth(ym: string): string {
  if (ym === "present") return "Present";
  const [year, month] = ym.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatRange(start: string, end: string): string {
  return `${formatMonth(start)} → ${formatMonth(end)}`;
}
