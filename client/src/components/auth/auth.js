import { redirect } from "react-router-dom";

/**
 * This represents some generic auth provider API, like Firebase.
 */
export const fakeAuthProvider = {
  isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
  username: localStorage.getItem("username"),
  async signIn(username) {
    await new Promise((r) => setTimeout(r, 500)); // fake delay
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("username", username);
    fakeAuthProvider.isAuthenticated = true;
    fakeAuthProvider.username = username;
  },
  async signOut() {
    await new Promise((r) => setTimeout(r, 500)); // fake delay
    localStorage.setItem("isAuthenticated", "false");
    localStorage.removeItem("username");
    fakeAuthProvider.isAuthenticated = false;
    fakeAuthProvider.username = "";
  },
};

export async function loginAction({ request }) {
  console.log("loginAction");
  const formData = await request.formData();
  const username = formData.get("username") | null;

  // Validate our form inputs and return validation errors via useActionData()
  if (!username) {
    return {
      error: "You must provide a username to log in",
    };
  }

  // Sign in and redirect to the proper destination if successful.
  try {
    await fakeAuthProvider.signIn(username);
  } catch (error) {
    // Unused as of now but this is how you would handle invalid
    // username/password combinations - just like validating the inputs
    // above
    return {
      error: "Invalid login attempt",
    };
  }

  const redirectTo = formData.get("redirectTo") | null;
  return redirect(redirectTo || "/");
}

export async function loginLoader() {
  if (fakeAuthProvider.isAuthenticated) {
    return redirect("/dashboard");
  }
  return null;
}

export function protectedLoader({ request }) {
  // If the user is not logged in and tries to access `/protected`, we redirect
  // them to `/login` with a `from` parameter that allows login to redirect back
  // to this page upon successful authentication
  if (!fakeAuthProvider.isAuthenticated) {
    let params = new URLSearchParams();
    params.set("from", new URL(request.url).pathname);
    return redirect("/login?" + params.toString());
  }
  return null;
}
