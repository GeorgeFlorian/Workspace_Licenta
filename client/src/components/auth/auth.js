import { redirect } from "react-router-dom";

/**
 * This represents some generic auth provider API, like Firebase.
 */
export const fakeAuthProvider = {
  isSessionExpired() {
    const expiresAt = localStorage.getItem("expiresAt");
    return expiresAt && parseInt(expiresAt) < Date.now();
  },
  username: localStorage.getItem("username"),
  async signIn(username, password) {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Successfully authenticated, update localStorage and redirect
        // const data = await response.json();
        localStorage.setItem("username", username);
        localStorage.setItem("expiresAt", Date.now() + 86400000); // 1 day expiration
        fakeAuthProvider.username = username;
      } else {
        throw new Error("Invalid username or password");
      }
    } catch (error) {
      console.error("LoginPage error:", error.message);
      throw new Error(error.message || "An error occurred while logging in");
    }
  },
  async signOut() {
    await new Promise((r) => setTimeout(r, 500)); // fake delay
    localStorage.removeItem("username");
    localStorage.removeItem("expiresAt");
    fakeAuthProvider.username = "";
  },
};

export async function loginAction({ request }) {
  const formData = await request.formData();
  const username = formData.get("username") || null;
  const password = formData.get("password") || null;

  // Validate form inputs
  if (!username || !password) {
    return {
      error: "You must provide both username and password to log in",
    };
  }
  const redirectTo = formData.get("redirectTo") || "/";

  // Sign in and redirect to the proper destination if successful.
  try {
    await fakeAuthProvider.signIn(username, password);
    redirect(redirectTo);
  } catch (error) {
    return {
      error: error.message,
    };
  }

  return null;
}

export async function loginLoader() {
  if (fakeAuthProvider.username) {
    return redirect("/dashboard");
  }
  return null;
}

export function protectedLoader({ request }) {
  // If the user is not logged in and tries to access `/protected`, we redirect
  // them to `/login` with a `from` parameter that allows login to redirect back
  // to this page upon successful authentication
  if (!fakeAuthProvider.username) {
    let params = new URLSearchParams();
    params.set("from", new URL(request.url).pathname);
    return redirect("/login?" + params.toString());
  }
  return null;
}
