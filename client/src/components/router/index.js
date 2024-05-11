import { createBrowserRouter, redirect } from "react-router-dom";
import { fakeAuthProvider } from "@auth/auth";

import PageWrapper from "@layout/PageWrapper";
import Login from "@auth/Login";
import Dashboard from "@pages/Dashboard";

import { loginAction, loginLoader, protectedLoader } from "@auth/auth";

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
        Component: Login,
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
      await fakeAuthProvider.signout();
      return redirect("/");
    },
  },
]);
