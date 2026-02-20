import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, clientOnly = false }) {
    const { session } = useAuth();

    if (!session.loaded) return null;

    if (adminOnly && !session.isAdmin) return <Navigate to="/spices" replace />;
    if (clientOnly && (!session.hasClientSession || session.isAdmin)) return <Navigate to="/login" replace />;

    return children;
}
