export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d >= 7)
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  if (d >= 2) return `${d} days ago`;
  if (d === 1) return "Yesterday";
  if (h >= 1) return `${h}h ago`;
  if (m >= 1) return `${m}m ago`;
  return "Just now";
}
