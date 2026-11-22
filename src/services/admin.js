import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Returns { name, email } for the signed-in admin.
// If the admin document or its name field is missing, it falls back to defaults.
export async function getAdminProfile() {
  const user = auth.currentUser;
  const profile = { name: "Administrador", email: user.email };
  try {
    const snapshot = await getDoc(doc(db, "admins", user.uid));
    if (snapshot.exists() && snapshot.data().name) {
      profile.name = snapshot.data().name;
    }
  } catch (err) {
    // the rules may not allow reading the admins collection yet
    console.error(err);
  }
  return profile;
}
