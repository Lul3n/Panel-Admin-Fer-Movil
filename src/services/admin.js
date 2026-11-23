import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// { name, email } of the signed-in admin, with defaults if the doc is missing
export async function getAdminProfile() {
  const user = auth.currentUser;
  const profile = { name: "Administrador", email: user.email };
  try {
    const snapshot = await getDoc(doc(db, "admins", user.uid));
    if (snapshot.exists() && snapshot.data().name) {
      profile.name = snapshot.data().name;
    }
  } catch (err) {
    // the rules may not allow reading admins
    console.error(err);
  }
  return profile;
}
