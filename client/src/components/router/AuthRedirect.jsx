import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext.jsx";

export const AuthRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null; // or a loading spinner
  }

  return user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
};
