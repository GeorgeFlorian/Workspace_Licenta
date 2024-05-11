import { createBrowserRouter, redirect } from "react-router-dom";

import PageWrapper from "@layout/PageWrapper";
import { LoginPage, Dashboard, Register } from "@pages";

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
    ],
  },
  {
    path: "/logout",
    async action() {
      // We sign out in a "resource route" that we can hit from a fetcher.Form
      await fakeAuthProvider.signOut();
      return redirect("/");
    },
  },
]);
