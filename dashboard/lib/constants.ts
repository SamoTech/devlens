export const DIM_META = [
  { key: "readme",    emoji: "📝", label: "README Quality",  weight: "20%" },
  { key: "activity",  emoji: "🔥", label: "Commit Activity", weight: "20%" },
  { key: "freshness", emoji: "🌿", label: "Repo Freshness",  weight: "15%" },
  { key: "docs",      emoji: "📚", label: "Documentation",   weight: "15%" },
  { key: "ci",        emoji: "⚙️",  label: "CI/CD Setup",    weight: "15%" },
  { key: "issues",    emoji: "🎯", label: "Issue Response",  weight: "10%" },
  { key: "community", emoji: "⭐", label: "Community Signal", weight: "5%" },
] as const;
export type DimKey = typeof DIM_META[number]["key"];
export function badgeColor(s: number): string {
  if (s >= 80) return "#22c55e";
  if (s >= 60) return "#84cc16";
  if (s >= 40) return "#eab308";
  return "#ef4444";
}
export function scoreLabel(s: number): string {
  if (s >= 90) return "Excellent";
  if (s >= 75) return "Good";
  if (s >= 60) return "Fair";
  if (s >= 40) return "Needs Work";
  return "Critical";
}