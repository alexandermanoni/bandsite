// Defines shape of auth state and creates the context

// Responsible for types/context

import { createContext, useEffect, useState } from "react";
import { authStorage } from "./authStorage";

export type AuthState = {
    login: (email: string, password: string) => Promise<"etaken" | "badreq" | "serr" | "uauth" | "ok">;
    signup: (email: string, password: string, verifypassword: string) => Promise<"etaken" | "badreq" | "serr" | "uauth" | "ok">;
    logout: () => Promise<"uauth" | "serr" | "ok">;

    initialized: boolean;
    authenticated: boolean;
}

export const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: React.ReactNode; }) {
    const [initialized, setInitialized] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);

    async function login(email: string, password: string) {
        const response = await fetch("http://localhost:8080/login", { method: "POST", body: JSON.stringify({ email, password }) });

        if (!response.ok) {
            // bad request
            if (response.status === 400) {
                return "badreq";
            }

            // internal server error
            if (response.status === 500) {
                return "serr";
            }

            return "uauth";
        }

        const result = await response.json();

        setAuthenticated(true);
        authStorage.setToken(result.accessToken);

        return "ok";
    }

    async function signup(email: string, password: string, verifypassword: string) {
        const response = await fetch("http://localhost:8080/signup", { method: "POST", body: JSON.stringify({ email, password, verifypassword }) });

        if (!response.ok) {
            // return what kind of error
            // email already exists
            // passwords don't match
            // general failed

            // internal server error
            if (response.status === 500) {
                return "serr";
            }

            // email already taken
            if (response.status === 409) {
                return "etaken";
            }

            // bad request (passwords don't match, or email malformed)
            if (response.status === 400) {
                return "badreq";
            }

            // general unauthorized
            return "uauth";
        }

        const result = await response.json();

        setAuthenticated(true);
        authStorage.setToken(result.accessToken);

        return "ok";
    }

    async function logout() {
        const response = await fetch("http://localhost:8080/logout", { method: "POST" });

        if (!response.ok) {
            // internal server error
            if (response.status === 500) {
                return "serr";
            }

            // unauthorized
            return "uauth";
        }

        authStorage.setToken("");
        setAuthenticated(false);

        return "ok";
    }

    // try to load auth token on startup
    useEffect(() => {
        async function initializeAuthentication() {
            // see if already have a token
            const existingToken = authStorage.getToken();

            // have token, good to go
            if (existingToken !== "") {
                setInitialized(true);
                setAuthenticated(true);
                return;
            }

            // no access token, try refresh
            try {
                const response = await fetch(
                    "http://localhost:8080/auth",
                    {
                        method: "POST",
                        credentials: "include",
                    }
                );

                // no refresh token either
                if (!response.ok) {
                    authStorage.clearToken();

                    return;
                }

                const data = await response.json();

                authStorage.setToken(data.accessToken);

                setAuthenticated(true);

                return;
            }
            catch (error) {
                // couldn't authenticate for whatever reason
                authStorage.clearToken();
                setAuthenticated(false);
            }
            finally {
                // tried to authenticate
                setInitialized(true);
            }
        }

        initializeAuthentication();
    }, [])

    return (
        <AuthContext.Provider
            value={{
                login,
                signup,
                logout,
                initialized,
                authenticated,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}