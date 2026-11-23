// Spark usage estimate for the "Uso del plan" screen

// Spark free limits (Firestore standard)
export const SPARK_LIMITS = {
  readsPerDay: 50000,
  writesPerDay: 20000,
  storedBytes: 1024 * 1024 * 1024, // 1 GiB
  transferBytesPerMonth: 10 * 1024 * 1024 * 1024, // 10 GiB
};

// Blaze prices in USD, approximate (depend on region)
const PRICE_PER_READ = 0.03 / 100000;
const PRICE_PER_WRITE = 0.09 / 100000;

// Assumptions
export const PAGE_SIZE = 20; // the apps load at most 20 publications and 20 notifications
export const ADMIN_LOADS_PER_DAY = 20; // times a day the admin opens a screen of the panel

// Date -> "2026-11-22", same key as usage/{day}
export function dayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Avg views per day this month
function viewsPerDay(publications) {
  const now = new Date();
  const key = dayKey(now).slice(0, 7); // "2026-11"
  let total = 0;
  for (const p of publications) {
    total += (p.viewsByMonth && p.viewsByMonth[key]) || 0;
  }
  return total / now.getDate();
}

function bytesOf(list) {
  // rough size: JSON + 20%
  return Math.round(JSON.stringify(list).length * 1.2);
}

export function estimateUsage(publications, notifications, usageDays) {
  const published = publications.filter((p) => p.status === "published").length;
  const views = viewsPerDay(publications);

  // real counter if there's data from the last 7 days, if not 1 open per view
  const recent = usageDays.slice(-7);
  const hasCounter = recent.length > 0;
  const peakOpens = hasCounter ? Math.max(...recent.map((d) => d.appOpens)) : Math.ceil(views);
  const averageOpens = hasCounter
    ? recent.reduce((sum, d) => sum + d.appOpens, 0) / recent.length
    : views;

  const readsPerOpen = Math.min(PAGE_SIZE, published) + Math.min(PAGE_SIZE, notifications.length);
  const adminReads = ADMIN_LOADS_PER_DAY * (publications.length + notifications.length);

  function readsFor(opens) {
    return Math.round(opens * readsPerOpen + views + adminReads);
  }
  function writesFor(opens) {
    // 1 write per view, +1 per open with the counter
    return Math.round(views + (hasCounter ? opens : 0));
  }

  const peakReads = readsFor(peakOpens);
  const peakWrites = writesFor(peakOpens);
  const averageReads = readsFor(averageOpens);
  const averageWrites = writesFor(averageOpens);

  const storedBytes = bytesOf(publications) + bytesOf(notifications) + usageDays.length * 60;
  const docCount = Math.max(1, publications.length + notifications.length);
  const bytesPerDoc = (bytesOf(publications) + bytesOf(notifications)) / docCount;
  const transferPerMonth = Math.round(averageReads * bytesPerDoc * 30);

  const meters = [
    { label: "Lecturas por día", value: peakReads, limit: SPARK_LIMITS.readsPerDay, unit: "count" },
    { label: "Escrituras por día", value: peakWrites, limit: SPARK_LIMITS.writesPerDay, unit: "count" },
    { label: "Datos guardados", value: storedBytes, limit: SPARK_LIMITS.storedBytes, unit: "bytes" },
    { label: "Transferencia al mes", value: transferPerMonth, limit: SPARK_LIMITS.transferBytesPerMonth, unit: "bytes" },
  ].map((m) => ({ ...m, percent: (m.value / m.limit) * 100 }));

  const highest = Math.max(...meters.map((m) => m.percent));
  let level = "green";
  if (highest >= 80) level = "red";
  else if (highest >= 50) level = "yellow";

  // monthly Blaze cost with the current usage
  const extraReads = Math.max(0, averageReads - SPARK_LIMITS.readsPerDay);
  const extraWrites = Math.max(0, averageWrites - SPARK_LIMITS.writesPerDay);
  const blazeCostPerMonth = (extraReads * PRICE_PER_READ + extraWrites * PRICE_PER_WRITE) * 30;

  return {
    hasCounter, peakOpens, averageOpens, views, readsPerOpen,
    meters, highest, level, blazeCostPerMonth,
    // opens per day before hitting the reads limit
    maxOpens: readsPerOpen === 0 ? 0 : Math.floor((SPARK_LIMITS.readsPerDay - views - adminReads) / readsPerOpen),
  };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
