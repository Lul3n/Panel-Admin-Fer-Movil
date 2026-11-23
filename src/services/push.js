import { auth } from "./firebase";

// Push worker (code in /push-worker), empty = push off
const PUSH_URL = "https://fer-movil-push.fer-movil.workers.dev";

export const PUSH_FAILED_MESSAGE =
  "Se guardó, pero no se pudo enviar la notificación push. Puedes mandarla desde la consola de Firebase.";

// Sends the push of a saved notice, false if it failed
export async function sendPush(notificationId) {
  if (!PUSH_URL) return true;
  try {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(PUSH_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    return res.ok;
  } catch (err) {
    console.error(err);
    return false;
  }
}
