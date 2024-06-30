import { redirect } from "react-router-dom";

/**
 * This represents some generic auth provider API, like Firebase.
 */
export const fakeAuthProvider = {
  isSessionExpired() {
    const username = localStorage.getItem("username");
    if (!username) return true; // No user logged in

    const expirationData =
      JSON.parse(localStorage.getItem("expirationData")) || {};
    const expiresAt = expirationData[username];
    return expiresAt && parseInt(expiresAt) < Date.now();
  },
  username: localStorage.getItem("username"),
  async signIn(username, password) {
    await new Promise((r) => setTimeout(r, 500)); // fake delay

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Successfully authenticated, update localStorage
        localStorage.setItem("username", username);

        const expirationData =
          JSON.parse(localStorage.getItem("expirationData")) || {};
        expirationData[username] = Date.now() + 86400000; // 1 day expiration
        localStorage.setItem("expirationData", JSON.stringify(expirationData));

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

    const username = localStorage.getItem("username");
    if (username) {
      const expirationData =
        JSON.parse(localStorage.getItem("expirationData")) || {};
      delete expirationData[username]; // Remove the expiration time for the user

      // Only update localStorage if there are remaining entries
      if (Object.keys(expirationData).length > 0) {
        localStorage.setItem("expirationData", JSON.stringify(expirationData));
      } else {
        localStorage.removeItem("expirationData");
      }
    }

    localStorage.removeItem("username");
    fakeAuthProvider.username = "";
  },
};

// In @auth/auth.js

export async function registerAction({ request }) {
  const formData = await request.formData();
  const email = formData.get("email");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const username = formData.get("username");
  const password = formData.get("password");

  if (!email || !firstName || !lastName || !username || !password) {
    return {
      error: "All fields are required to register",
    };
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, firstName, lastName, username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    return redirect("/login");
  } catch (error) {
    console.error("RegisterPage error:", error.message);
    return {
      error: error.message || "An error occurred while registering",
    };
  }
}


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
  if (!fakeAuthProvider.username) {
    let params = new URLSearchParams();
    params.set("from", new URL(request.url).pathname);
    return redirect("/login?" + params.toString());
  }
  return null;
}
