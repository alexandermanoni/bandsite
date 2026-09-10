// Stores tokens

let token: string = "";
let spotifyAccessToken: string = "";
let spotifyCode: string | null = "";
//let spotifyVerifier: string = "";

export const authStorage = {
    getToken() {
        return token;
    },

    getSpotifyAccessToken() {
        // return localStorage.getItem("spotifyaccesstoken");
        return spotifyAccessToken;
    },

    getSpotifyCode() {
        // get code from search params
        // const params = new URLSearchParams(window.location.search);
        // const code = params.get("code");

        // if (code) {
        //     spotifyCode = code;
        // }

        return spotifyCode;
    },

    getSpotifyVerifier() {
        // don't have it in ram
        // if (spotifyVerifier === "") {
        //     // try to get it if it's stored
        //     const localverifier = localStorage.getItem("verifier");

        //     // if not stored, just leave empty
        //     if (localverifier) {
        //         spotifyVerifier = localverifier;
        //     }
        // }

        return localStorage.getItem("verifier");

        //return spotifyVerifier;
    },

    setToken(newtoken: string) {
        token = newtoken;
    },

    setSpotifyAccessToken(newtoken: string) {
        //localStorage.setItem("spotifyaccesstoken", newtoken);
        console.log("Setting Spotify access token...");
        spotifyAccessToken = newtoken;
        console.log("Spotify access token set.");
    },

    setSpotifyCode(newcode: string) {
        console.log("Setting Spotify code...");
        spotifyCode = newcode;
        console.log("Spotify code set.");
    },

    setSpotifyVerifier(newverifier: string) {
        //spotifyVerifier = newverifier;
        console.log("Setting Spotify verifier...");
        localStorage.setItem("verifier", newverifier);
        console.log("Spotify verifier set.");
    },

    clearToken() {
        token = "";
    },

    // these are disabled for now since they are messing everything up
    // need to fix where these are used
    clearSpotifyAccessToken() {
        console.log("Clearing Spotify access token...");
        spotifyAccessToken = "";
        console.log("Spotify access token cleared.");
    },

    clearSpotifyCode() {
        console.log("Clearing Spotify code...");
        spotifyCode = "";
        console.log("Spotify code cleared.");
    },

    clearSpotifyVerifier() {
        //spotifyVerifier = "";
        console.log("Clearing Spotify verifier");
        localStorage.removeItem("verifier");
        console.log("Cleared Spotify verifier");
    }
};