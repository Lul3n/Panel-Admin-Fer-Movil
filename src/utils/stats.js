export function sumViews(list) {
  return list.reduce((sum, p) => sum + (p.views || 0), 0);
}

export function topByViews(list, n) {
  return [...list].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, n);
}

export function viewsByAudience(list) {
  const totals = { general: 0, scholars: 0, applicants: 0 };
  for (const p of list) {
    totals[p.type] = (totals[p.type] || 0) + (p.views || 0);
  }
  return totals;
}

export function countThisMonth(list) {
  const now = new Date();
  return list.filter((p) => {
    if (!p.createdAt) return false;
    const d = p.createdAt.toDate();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

// viewsByMonth key, e.g. "2026-11"
export function monthKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

// Views of one month across all posts
export function viewsInMonth(list, key) {
  return list.reduce((sum, p) => sum + ((p.viewsByMonth && p.viewsByMonth[key]) || 0), 0);
}

// Months with data + current one, newest first
export function availableMonths(list) {
  const keys = new Set([monthKey(new Date())]);
  for (const p of list) {
    Object.keys(p.viewsByMonth || {}).forEach((k) => keys.add(k));
  }
  return [...keys].sort().reverse();
}

// Years with data + current one, newest first
export function availableYears(list) {
  const years = new Set(availableMonths(list).map((k) => k.slice(0, 4)));
  return [...years].sort().reverse();
}

// Views in a period (year/month can be "all"). With both "all" it uses the
// full counter so old views still count
export function periodViews(p, year, month) {
  if (year === "all" && month === "all") return p.views || 0;
  let sum = 0;
  for (const [key, value] of Object.entries(p.viewsByMonth || {})) {
    const [y, m] = key.split("-");
    if ((year === "all" || y === year) && (month === "all" || m === month)) sum += value;
  }
  return sum;
}

// "2026-11" -> "noviembre 2026"
export function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  const name = new Date(year, month - 1, 1).toLocaleDateString("es-MX", { month: "long" });
  return `${name} ${year}`;
}

export function formatNumber(n) {
  return n.toLocaleString("en-US");
}
