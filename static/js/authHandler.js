function logOut() {
  firebase
    .auth()
    .signOut()
    .then(function () {
      localStorage.removeItem("name");
      window.location = URI_KEYS.AUTH.LOGOUT;
    });
}
async function onSignIn(user) {
  if (user == null || user == undefined) return;

  document.querySelector("form.loginForm>[name='account-token']").value =
    await user.getIdToken();
  localStorage.setItem("name", user.displayName);
  return document.querySelector("form.loginForm").submit();
}
