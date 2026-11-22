import { collection, getDocs, query, where, documentId } from "firebase/firestore";
import { db } from "./firebase";

// The apps add 1 to usage/{YYYY-MM-DD}.appOpens every time they are opened.
// Returns [{ day: "2026-11-22", appOpens: 35 }, ...] from fromDay on, oldest first.
export async function listUsageDays(fromDay) {
  const q = query(collection(db, "usage"), where(documentId(), ">=", fromDay));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ day: d.id, appOpens: d.data().appOpens || 0 }))
    .sort((a, b) => a.day.localeCompare(b.day));
}
