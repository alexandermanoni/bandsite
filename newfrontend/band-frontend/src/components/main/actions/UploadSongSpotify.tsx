import { useContext, useEffect, useState } from "react";
import { spotifyApiFetch } from "../../../api/api";
import { authStorage } from "../../../auth/authStorage";
import { SpotifyAuthContext } from "../../../auth/SpotifyAuthContext";

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

function UploadSongSpotify() {
    const context = useContext(SpotifyAuthContext);

    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [current_track, setTrack] = useState(track);

    async function searchSpotify(search: string) {
        let sanitizedsearch: string = search;

        sanitizedsearch = sanitizedsearch.replaceAll(" ", "%");

        console.log("Sanitized: ", sanitizedsearch);

        const response = await spotifyApiFetch(`https://api.spotify.com/v1/search?q=${sanitizedsearch}&type=track&limit=10`, { method: "GET" });

        const result = response.json();

        console.log("Search result: ", result);
    }
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {

        console.log("Val: ", event.target.value);

        searchSpotify(event.target.value);

    }

    async function playSong() {
        await spotifyApiFetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },            
            body: JSON.stringify({
                device_ids: [deviceId],
                play: true
            })
        });

        console.log("Making Everlong play request with device id: ", deviceId);

        await spotifyApiFetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },            
            body: JSON.stringify({
                device_id: deviceId,
                uris: ["spotify:track:6ExjM3jOscudCB8hISfeNl"]
            })
        });
    }

    useEffect(() => {
        console.log("Creating playback device...");

        if (!context.authenticated) {
            console.log("Spotify context not authenticated, aborting...");
            return;
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
            //console.log("Token: ", authStorage.getSpotifyAccessToken());
            console.log("Setting player and listeners...");

            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(authStorage.getSpotifyAccessToken()); },
                volume: 1.0
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }) => {
                console.log("ready w/ device id: ", device_id);
                setDeviceId(device_id);
                setActive(true);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log("device id has gone offline: ", device_id);
                setDeviceId(null);
            });

            player.addListener('player_state_changed', (state => {
                if (!state) return;

                setTrack(state.track_window.current_track);
                setPaused(state.paused);

                player.getCurrentState().then(state => {
                    (!state) ? setActive(false) : setActive(true)
                });
            }));

            console.log("Player and listeners set.");

            console.log("Connecting player...");
            player.connect();
            console.log("Player connected.");
        };

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);
    }, [context.authenticated]);

    useEffect(() => {
        if (!is_active) return;

        playSong();
    }, [is_active]);

    // useEffect(() => {
    //     if (!deviceId) return;
    //     playSong();
    // }, [deviceId]);

    if (!is_active) {
        return (
            <>
                <div>
                    <b> Instance not active. Transfer playback using Spotify app </b>
                </div>
                <button onClick={playSong}>
                    Start playback
                </button>
            </>
        );
    } else {
        return (
            <>
                <div className="container">
                    <div className="main-wrapper">

                        <img src={current_track.album.images[0].url} className="now-playing__cover" alt="" />

                        <div className="now-playing__side">
                            <div className="now-playing__name">{current_track.name}</div>
                            <div className="now-playing__artist">{current_track.artists[0].name}</div>

                            <button className="btn-spotify" onClick={() => { player!.previousTrack() }} >
                                &lt;&lt;
                            </button>

                            <button className="btn-spotify" onClick={() => { player!.togglePlay() }} >
                                {is_paused ? "PLAY" : "PAUSE"}
                            </button>

                            <button className="btn-spotify" onClick={() => { player!.nextTrack() }} >
                                &gt;&gt;
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // return (
    //     <>
    //         <input type="text" onChange={handleChange} />
    //     </>
    // );
}

export default UploadSongSpotify;