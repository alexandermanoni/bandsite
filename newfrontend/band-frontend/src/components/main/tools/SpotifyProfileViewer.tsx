import { useContext, useEffect } from "react";
import { SpotifyAuthContext } from "../../../auth/SpotifyAuthContext";

// redirect user to spotify authorization page
async function redirectToAuthCodeFlow(clientId: string) {
    // use PKCE (pnc - "pixy", Proof Key for Code Exchange) standard
    // https://datatracker.ietf.org/doc/html/rfc7636#section-4.1

    // high-entropy cryptographic random string w/ unreserved characters
    const verifier = generateCodeVerifier(128);
    // code challenge (base64url-encode(sha256(code_verifier)))
    const challenge = await generateCodeChallenge(verifier);

    // store verifier
    localStorage.setItem("verifier", verifier);

    // new params to pass to Spotify API
    const params = new URLSearchParams();
    // id of app trying to access
    params.append("client_id", clientId);
    // need code
    params.append("response_type", "code");
    // where to redirect after Spotify auth page (this is in Redirect URIs on Sptfy dev app screen)
    params.append("redirect_uri", "http://127.0.0.1:5173/home");
    // permissions needed
    params.append("scope", "user-read-private user-read-email");
    // challenge type (optional w/ "plain" default)
    params.append("code_challenge_method", "S256");
    // send challenge with authorization request
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// code_verifier for standard
function generateCodeVerifier(length: number) {
    let text = '';
    // only use unreserved characters
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // fill text w/ number amount of chars
    for (let i = 0; i < length; i++) {
        // is this high-entropy?
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// challenge derived from code_verifier
async function generateCodeChallenge(codeVerifier: string) {
    // convert string to bytes w/ utf-8 encoding
    const data = new TextEncoder().encode(codeVerifier);
    // hash code_verifier (sha256)
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    // btoa - base64 to ascii
    // ...Uint8Array - convert to base64 array
    // replace +, / with -, _
    // remove = padding
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function getAccessToken(clientId: string, code: string): Promise<string> {
    // get verifier from storage
    const verifier = localStorage.getItem("verifier");

    // new params for api request to get accesstoken
    // pass both the code from url AND verifier so attacker can't use code w/out verifier
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://127.0.0.1:5173/home");
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

function LolSpotifyProfileViewer() {
    // id of the spotify app I created for SCU
    const clientId = "45f312337d664a3db729bada4d7cb8dc";
    // get params (like spotify code) from url search
    const params = new URLSearchParams(window.location.search);
    // get the code from the url search parameters
    const code = params.get("code");

    // run on app start
    useEffect(() => {
        const boot = async () => {
            // if no code found, need to log in
            if (!code) {
                redirectToAuthCodeFlow(clientId);
            }
            else {
                // get accesstoken for spotify
                const accessToken = await getAccessToken(clientId, code);
                // get profile from spotify
                const profile = await fetchProfile(accessToken);
                // log profile
                console.log("Profile: ", profile);                
            }
        }

        boot();
    }, []);

    return (
        <>
            {/* dummy */}
            <div>
                Hello :D
            </div>
        </>
    );
}

function SpotifyProfileViewer() {
    const context = useContext(SpotifyAuthContext);
    
    return (
        <>
            {
                context.authenticated &&
                <div>
                    Logged in to Spotify
                </div>
            }
            {
                !context.authenticated &&
                <button type="button" onClick={context.login}>
                    Click to log in to Spotify
                </button>
            }
        </>
    );
}

export default SpotifyProfileViewer;