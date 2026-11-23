import {
  collection, addDoc, getDocs, doc, deleteDoc,
  query, orderBy, serverTimestamp
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { sendPush } from "./push";

const notificationsRef = collection(db, "notifications");

export async function listNotifications() {
  const q = query(notificationsRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Manual notice (reminder), the automatic ones are made in publishPublication
export async function createNotification(data) {
  const ref = await addDoc(notificationsRef, {
    adminId: auth.currentUser.uid,
    publicationId: data.publicationId || null,
    title: data.title,
    message: data.message,
    target: data.target,
    date: serverTimestamp(),
  });
  return sendPush(ref.id);
}

export async function deleteNotification(id) {
  await deleteDoc(doc(db, "notifications", id));
}
