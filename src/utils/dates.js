// "2026-11-30" -> end of that day, local time
export function dateFromInput(value) {
  if (!value) return null;
  return new Date(`${value}T23:59:59`);
}

// Firestore Timestamp -> "08 nov 2026, 10:30 p. m."
export function formatDateTime(timestamp) {
  if (!timestamp) return "";
  return timestamp.toDate().toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Date -> "2026-11-30", the format <input type="date"> expects
export function formatInputDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
