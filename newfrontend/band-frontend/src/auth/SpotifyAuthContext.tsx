import { createContext, useEffect, useState } from "react";
import { authStorage } from "./authStorage";

export type SpotifyAuthState = {
    login: () => Promise<any>;
    initialized: boolean;
    authenticated: boolean;
}

export const SpotifyAuthContext = createContext<SpotifyAuthState>(null!);

async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    // store verifier
    authStorage.setSpotifyVerifier(verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://127.0.0.1:5173/home"); // [NOTE]: this needs to be updated for prod & dev
    params.append("scope", "streaming user-read-private user-read-email"); 
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    // navigate to Spotify page
    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function getAccessToken(clientId: string, code: string): Promise<string> {
    // get verifier from storage
    const verifier = authStorage.getSpotifyVerifier();

    // new params for api request to get accesstoken
    // pass both the code from url AND verifier so attacker can't use code w/out verifier
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://127.0.0.1:5173/home"); // [NOTE]: this needs to be updated for prod & dev
    params.append("code_verifier", verifier!);

    // make request
    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    // get Spotify access_token from response
    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token: string): Promise<any> {
    // get profile info w/ access token
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

export function SpotifyAuthContextProvider({ children }: { children: React.ReactNode; }) {
    const [initialized, setInitialized] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);

    const clientId = "45f312337d664a3db729bada4d7cb8dc";

    async function login() {
        // no code found, need to log in
        try {
            redirectToAuthCodeFlow(clientId);
        }
        catch (error) {
            authStorage.clearSpotifyAccessToken();
            authStorage.clearSpotifyCode();
            authStorage.clearSpotifyVerifier();
        }
        finally {
            setInitialized(true);
        }
    }

    // async function login() {
    //     // see if already have a code
    //     const code = authStorage.getSpotifyCode();

    //     console.log("Spotify Code: ", code);

    //     // have code, good to go
    //     if (code) {
    //         const accessToken = await getAccessToken(clientId, code);
    //         if (accessToken != undefined) {
    //             authStorage.setSpotifyAccessToken(accessToken);
    //         const profile = await fetchProfile(accessToken);
    //         console.log("Profile: ", profile);

    //         setInitialized(true);
    //         setAuthenticated(true);
    //         }
            

    //         return;
    //     }

    //     // no code found, need to log in
    //     try {
    //         redirectToAuthCodeFlow(clientId);
    //     }
    //     catch (error) {
    //         // couldn't authenticate for whatever reason
    //         authStorage.clearSpotifyAccessToken();
    //         authStorage.clearSpotifyCode();
    //         authStorage.clearSpotifyVerifier();
    //         setAuthenticated(false);
    //     }
    //     finally {
    //         setInitialized(true);
    //     }
    // }

    // check if have code
    // useEffect(() => {
    //     const boot = async () => {
    //         const code = authStorage.getSpotifyCode();

    //         if (!code) {
    //             setInitialized(false);
    //             setAuthenticated(false);
    //             return;
    //         }

    //         const accessToken = await getAccessToken(clientId, code);
    //         authStorage.setSpotifyAccessToken(accessToken);
    //         const profile = await fetchProfile(accessToken);
    //         console.log("Profile: ", profile);

    //         console.log("Access: ", accessToken);

    //         setInitialized(true);
    //         setAuthenticated(true);
    //     }

    //     boot();
    // }, []);

    // run when site loads
    useEffect(() => {
        const boot = async () => {
            console.log("Booting...");

            // get code
            let code = authStorage.getSpotifyCode();
            console.log("Current Spotify code: ", code);

            // if there is no code
            if (!code) {
                console.log("Spotify code null...");

                // try to get code from url
                const params = new URLSearchParams(window.location.search);
                code = params.get("code");

                console.log("Spotify code retrieved from url: ", code);

                // got code from login
                if (code) {
                    console.log("Code retrieved from login...");
                    // store code
                    authStorage.setSpotifyCode(code);

                    // remove ?code= from URL (might break stuff double check)
                    // window.history.replaceState({}, "", "/home");
                }
            }

            // no code, didn't login or error, don't do anything
            if (!code) {
                console.log("No Spotify code in URL. Initialized but not authenticated");

                setInitialized(true);
                setAuthenticated(false);
                return;
            }

            console.log("Spotify code found, getting access token...");

            // have code, try to get access token
            try {
                // get token with code
                const accessToken = await getAccessToken(clientId, code);
                console.log("Access token retrieved: ", accessToken);

                // store token
                authStorage.setSpotifyAccessToken(accessToken);

                // get profile for debug
                // const profile = await fetchProfile(accessToken);
                // console.log("Profile: ", profile);

                // user has accesstoken, is authenticated
                console.log("Authenticated.");
                setAuthenticated(true);
            }
            // error getting access token, clear all, not authenticated
            catch (error) {
                console.log("Error getting Spotify access token.");
                authStorage.clearSpotifyAccessToken();
                authStorage.clearSpotifyCode();
                authStorage.clearSpotifyVerifier();

                console.log("Not authenticated.");
                setAuthenticated(false);
            }
            // tried to authenticate
            finally {
                console.log("Initialized.");
                setInitialized(true);
            }
        };

        boot();
    }, []);

    return (
        <SpotifyAuthContext.Provider
            value={{
                login,
                initialized,
                authenticated
            }}
        >
            {children}
        </SpotifyAuthContext.Provider>
    )
}