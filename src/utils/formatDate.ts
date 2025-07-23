export function formatDate(dateString: string): string {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
