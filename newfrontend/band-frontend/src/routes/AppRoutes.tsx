import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/login/LoginPage";
import { SignUpPage } from "../pages/login/SignupPage";
import { NewMainPage } from "../pages/NewMainPage";
import { useAuth } from "../auth/useAuth";

function RootRedirect() {
    const { initialized, authenticated } = useAuth();

    // console.log("Init: ", initialized);
    // console.log("Auth: ", authenticated);

    if (!initialized) {
        return <div>Loading...</div>
    }

    if (initialized && authenticated) {
        return <Navigate to="/home" replace />;
    }

    return <Navigate to="/login" replace />;
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