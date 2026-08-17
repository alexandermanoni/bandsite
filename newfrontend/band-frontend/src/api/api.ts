// Automatically handles authentication for api calls to backend
// Use this instead of fetch

import { authStorage } from "../auth/authStorage";

//const siteurl = "http://localhost:8080/api/";
const siteurl = "https://bandsite-service-943772568820.us-central1.run.app/api/";

export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const makeRequest = async () => {
        const token = authStorage.getToken();

        const headers = new Headers(options.headers);

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        // if not sending form, sending json
        if (!(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        return fetch(siteurl + url, {
            ...options,
            headers,
            credentials: "include",
        });
    }

    let response = await makeRequest();

    console.log("Res: ", response);

    // token valid (no status unauthorized)
    if (response.status !== 401) {
        return response;
    }

    // try refresh token
    const refreshResponse = await fetch(
        "https://bandsite-service-943772568820.us-central1.run.app/auth",
        //"http://localhost:8080/auth",
        {
            method: "POST",
            credentials: "include",
        }
    );

    // if refresh token is invalid
    if (!refreshResponse.ok) {
        console.log("HERE");
        authStorage.clearToken();

        return response;
    }

    // otherwise, get token and try again
    const data = await refreshResponse.json();

    authStorage.setToken(data.accessToken);

    return makeRequest();
}