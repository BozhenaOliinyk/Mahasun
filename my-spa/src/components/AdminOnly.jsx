import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminOnly({ children, fallbackTo = "/spices" }) {
  const { session } = useAuth();

  if (!session?.loaded) return null;

  if (!session.isAdmin) return <Navigate to={fallbackTo} replace />;

  return children;
}
