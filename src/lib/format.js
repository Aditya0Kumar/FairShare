export function formatDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return String(date);
}

export function dateValue(date) {
  return new Date(date).getTime();
}
