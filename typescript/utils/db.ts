import { initializeApp } from "firebase/app";
import { webConfig } from "./config";

import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// exporting variables
export const app = initializeApp(webConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const authProviders = [GithubAuthProvider, GoogleAuthProvider];
