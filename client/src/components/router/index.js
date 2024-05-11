import { createBrowserRouter, redirect } from "react-router-dom";

import PageWrapper from "@layout/PageWrapper";
import { LoginPage, Dashboard, Register, NotFound } from "@pages/";

import {
  loginAction,
  loginLoader,
  protectedLoader,
  fakeAuthProvider,
} from "@auth/auth";

export const router = createBrowserRouter([
  {
    id: "root",
    path: "/",
    loader() {
      // Our root route always provides the user, if logged in
      return { user: fakeAuthProvider.username };
    },
    Component: PageWrapper,
    children: [
      {
        index: true,
        loader() {
          const user = fakeAuthProvider.username;
          return redirect(user ? "/dashboard" : "/login");
        },
      },
      {
        path: "login",
        action: loginAction,
        loader: loginLoader,
        Component: LoginPage,
      },
      {
        path: "dashboard",
        loader: protectedLoader,
        Component: Dashboard,
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
