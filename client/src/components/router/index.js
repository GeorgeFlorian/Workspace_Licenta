import { createBrowserRouter, redirect } from "react-router-dom";

import Layout from "@layout/Layout.jsx";
import { LoginPage, Dashboard, Register, NotFound } from "@pages/";

import {
  loginAction,
  loginLoader,
  protectedLoader,
  fakeAuthProvider,
} from "@auth/auth";
import PageWrapper from "@layout/PageWrapper.jsx";

export const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    loader() {
      // Our root route always provides the user, if logged in
      return { user: fakeAuthProvider.username };
    },
    Component: Layout,
    children: [
      {
        index: true,
        loader() {
          const authenticated = fakeAuthProvider.username && fakeAuthProvider.isSessionExpired();
          return redirect(authenticated ? "/dashboard" : "/login");
        },
      },
      {
        path: "login",
        action: loginAction,
        loader: loginLoader,
        Component: LoginPage,
      },
      {
        Component: PageWrapper,
        children: [
          {
            path: "dashboard",
            loader: protectedLoader,
            Component: Dashboard,
          },
          // Add more protected routes here
        ],
      },
      {
        path: "register",
        Component: Register,
      },
    ],
  },
  {
    path: "/logout",
    async action() {
      const user = fakeAuthProvider.username;

      if (user) {
        // If the user is logged in, sign them out
        await fakeAuthProvider.signOut();
      }
      return redirect("/");
    },
    loader() {
      return redirect("/404");
    },
  },
  {
    path: "*", // Matches any path
    Component: NotFound,
  },
]);
