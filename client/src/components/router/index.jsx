import { createBrowserRouter } from "react-router-dom";
import Layout from "@layout/Layout.jsx";
import { AuthRedirect } from "@components/router/AuthRedirect.jsx";
import { Dashboard, LoginPage, NotFound, Register } from "@pages/index.js";
import ProtectedRoute from "@components/router/ProtectedRoute.jsx";
import PageWrapper from "@layout/PageWrapper.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <AuthRedirect />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        element: <PageWrapper />,
        children: [
          {
            path: "dashboard",
            element: (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
