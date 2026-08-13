import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function ProtectedRoute() {
    const { initialized, authenticated } = useAuth();

    // trying tokens
    if (!initialized) {
        return <div>Loading...</div>
    }
    
    // refresh token failed
    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}