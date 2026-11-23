import {
  collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, Timestamp
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { sendPush } from "./push";

const publicationsRef = collection(db, "publications");
const notificationsRef = collection(db, "notifications");

async function deleteNotificationsOf(publicationId) {
  const q = query(notificationsRef, where("publicationId", "==", publicationId));
  const snapshot = await getDocs(q);
  for (const d of snapshot.docs) {
    await deleteDoc(d.ref);
  }
}

export async function listAllPublications() {
  const q = query(publicationsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Expired ones become "expired" so the apps stop showing them (runs on every load)
  const now = Date.now();
  for (const p of list) {
    if (p.status === "published" && p.expiresAt && p.expiresAt.toMillis() < now) {
      await updateDoc(doc(db, "publications", p.id), {
        status: "expired",
        updatedAt: serverTimestamp(),
      });
      await deleteNotificationsOf(p.id);
      p.status = "expired";
    }
  }
  return list;
}

export async function getPublication(id) {
  const snapshot = await getDoc(doc(db, "publications", id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// Creates it as a draft, ref.id is the new id
export async function createPublication(data) {
  return addDoc(publicationsRef, {
    adminId: auth.currentUser.uid,
    type: data.type,
    status: "draft",
    title: data.title,
    description: data.description,
    linkImg: data.linkImg || null,
    documents: data.documents || [],
    publishedAt: null,
    expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
    views: 0,
    viewsByMonth: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Content only, status goes through publish/unpublish
export async function updatePublication(id, data) {
  await updateDoc(doc(db, "publications", id), {
    type: data.type,
    title: data.title,
    description: data.description,
    linkImg: data.linkImg || null,
    documents: data.documents || [],
    expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
    updatedAt: serverTimestamp(),
  });
}

export async function publishPublication(p) {
  await updateDoc(doc(db, "publications", p.id), {
    status: "published",
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // remove the old one so republishing doesn't duplicate it
  await deleteNotificationsOf(p.id);
  const ref = await addDoc(notificationsRef, {
    adminId: auth.currentUser.uid,
    publicationId: p.id,
    title: p.title,
    message: p.description.slice(0, 120),
    target: p.type,
    date: serverTimestamp(),
  });
  // false if the push failed
  return sendPush(ref.id);
}

// Updates the notice after an edit (keeps the original date)
export async function syncNotification(p) {
  const q = query(notificationsRef, where("publicationId", "==", p.id));
  const snapshot = await getDocs(q);
  for (const d of snapshot.docs) {
    await updateDoc(d.ref, {
      title: p.title,
      message: p.description.slice(0, 120),
      target: p.type,
    });
  }
}

export async function unpublishPublication(id) {
  await updateDoc(doc(db, "publications", id), {
    status: "draft",
    updatedAt: serverTimestamp(),
  });
  await deleteNotificationsOf(id);
}

export async function deletePublication(id) {
  await deleteDoc(doc(db, "publications", id));
  await deleteNotificationsOf(id);
}
