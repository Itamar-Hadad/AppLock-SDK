import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { AuthenticatedLayout } from "../layout/AuthenticatedLayout";

export function RequireAuth() {
  const { developer, loading } = useAuth();

  if (loading) {
    return null;
  }

  return developer ? <AuthenticatedLayout /> : <Navigate to="/login" replace />;
}