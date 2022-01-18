function signIn() {
  let provider = new firebase.auth.GoogleAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then((value) => onSignIn(value));
}
function logOut() {
  firebase
    .auth()
    .signOut()
    .then(function () {
      window.location = URI_KEYS.AUTH.LOGOUT;
    });
}
function onSignIn(user) {
  if (user == null || user == undefined) return;

  document.querySelector("form.loginForm>[name='account-email']").value =
    user.email;
  document.querySelector("form.loginForm>[name='account-name']").value =
    user.displayName;
  document.querySelector("form.loginForm>[name='account-photo']").value =
    user.photoURL;
  document.querySelector("form.loginForm>[name='account-uid']").value =
    user.uid;
  return document.querySelector("form.loginForm").submit();
}
