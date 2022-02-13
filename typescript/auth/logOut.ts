import { auth } from "../utils/db";

export function logOut() {
  auth.signOut().then(() => {
    window.location.href = "/";
  });
}
