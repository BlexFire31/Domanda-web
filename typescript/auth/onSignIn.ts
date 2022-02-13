import { User } from "firebase/auth";

export function onSignIn(
  currentUser: User | null,
  redirectUrl: string | null
): boolean {
  if (currentUser == null) return false;
  let form = document.createElement("form");
  let input = document.createElement("input");

  input.name = "token";
  input.type = "hidden";
  form.action = "/auth/logIn";
  form.method = "POST";

  form.appendChild(input);

  currentUser.getIdToken().then((token) => {
    input.value = token;
    document.body.appendChild(form);
    form.submit();
  });

  return true;
}
