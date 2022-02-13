import * as firebaseUI from "firebaseui";
import { auth, authProviders } from "../utils/db";
const authWidget = new firebaseUI.auth.AuthUI(auth);
import { onSignIn } from "./onSignIn";
export function startAuthWidget(
  element: string,
  onSignInRedirectURL: string | null
) {
  authWidget.start(element, {
    signInOptions: [
      ...authProviders.map((provider) => provider.PROVIDER_ID),
      "microsoft.com",
    ],
    callbacks: {
      signInSuccessWithAuthResult: () => {
        return onSignIn(auth.currentUser, onSignInRedirectURL);
      },
    },
  });
}
