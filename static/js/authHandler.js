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
async function onSignIn(user) {
  if (user == null || user == undefined) return;

  document.querySelector("form.loginForm>[name='account-token']").value =
    await user.getIdToken();
  return document.querySelector("form.loginForm").submit();
}
