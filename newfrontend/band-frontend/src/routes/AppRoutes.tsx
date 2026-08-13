import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/login/LoginPage";
import { SignUpPage } from "../pages/login/SignupPage";
import { NewMainPage } from "../pages/NewMainPage";
import { useAuth } from "../auth/useAuth";

function RootRedirect() {
    const { authenticated } = useAuth();

    return authenticated
        ? <Navigate to="/home" replace />
        : <Navigate to="/login" replace />;
}

export function AppRoutes() {
    return (
        <Routes>            
            <Route
                path="/"
                element={<RootRedirect />}
            />

            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route
                path="/signup"
                element={<SignUpPage />}
            />

            <Route element={<ProtectedRoute />}>
                <Route
                    path="/home"
                    element={
                        <NewMainPage />
                    }
                />
            </Route>
        </Routes>
    )
}