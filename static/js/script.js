var firestore;
var auth;

function sanitize(text = "") {
  if (text == "" || text == null) return null;
  let sanitizer = document.createElement("div");
  sanitizer.textContent = text;
  return sanitizer.innerHTML;
}

(async function () {
  window.body = document.body;
  await firebase.initializeApp(firebaseConfig);
  firebase.analytics();
  window.auth = firebase.auth();
  window.firestore = firebase.firestore();
})();

const allowedOptions = ["A", "B", "C", "D", "E", "F"];
