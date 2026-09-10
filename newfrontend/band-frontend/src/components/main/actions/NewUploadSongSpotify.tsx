import { useEffect, useRef, useState } from "react";
import type { Song } from "../../navigation/NewContextManagement";
import { spotifyApiFetch } from "../../../api/api";

type NewUploadSongSpotifyProps = {
    song: Song;
    uploadSongSpotify: (song: Song, uri: string) => Promise<void>;
}

type track = {
    name: string;
    uri: string;
    artists: {
        name: string;
    }[];
}

function NewUploadSongSpotify({ song, uploadSongSpotify }: NewUploadSongSpotifyProps) {
    // whether user is currently searching for a song
    const [searching, setSearching] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState<string>("");
    const [selectedTrack, setSelectedTrack] = useState<track>(null);
    const [displayedTracks, setDisplayedTracks] = useState<track[]>([]);

    let songReqController: AbortController | null;
    async function searchSpotify(search: string) {
        // cancel old request for songs
        songReqController?.abort();

        // transform search for url
        let sanitizedsearch: string = search.trim();
        //sanitizedsearch = sanitizedsearch.replaceAll(" ", "%"); // replace spaces with %

        // create new controller for this request
        const currentController = new AbortController();
        songReqController = currentController;

        // fetch songs
        const response = await spotifyApiFetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(sanitizedsearch)}&type=track&limit=10`,
            { 
                signal: currentController.signal,
                method: "GET" 
            }
        );

        // reset controller only if this is the most recent request, don't make it null if
        // there's a newer fetch
        if (songReqController === currentController) {
            songReqController = null;
        }

        if (!response.ok) {
            console.error("Failed to fetch songs from Spotify for search: ", search);
            return;
        }

        const result = await response.json();

        const newtracks = result.tracks.items.map((track: track) => ({
            name: track.name,
            uri: track.uri,
            artists: track.artists
        }));

        setDisplayedTracks(newtracks);
        console.log("RES: ", newtracks);
    }

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
        if (event.target.value == "") return;
        searchSpotify(event.target.value);
    }

    const handleSelectTrack = (track: track) => {
        setSelectedTrack(track);
        setSearch(track.name);
        setDisplayedTracks([]);
        uploadSongSpotify(song, track.uri);
        setSearching(false);
    }

    // focus the input when the user clicks "choose on spotify"
    useEffect(() => {
        if (searching) {
            inputRef.current?.focus();
        }
    }, [searching]);

    return (
        <>
            {
                searching &&
                <>
                    <input ref={inputRef} type="text" value={search} onChange={handleChange} placeholder="Search for a song..."/>
                    {displayedTracks.length > 0 && (
                        <div>
                            {displayedTracks.map((track) => (
                                <button
                                    key={track.uri}
                                    type="button"
                                    onClick={() => handleSelectTrack(track)}
                                >
                                    <span>{track.name}</span>
                                    <span>
                                        {track.artists
                                            .map((artist) => artist.name)
                                            .join(", ")}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    <button type="button" onClick={() => setSearching(false)}>
                        Cancel
                    </button>
                    {/* <select className="dropdown" name="spotifysongdropdown">
                        {(displayedTracks ?? []).map((track) => (
                            <option key={track.uri} value={track.uri}>{track.name}</option>
                        ))}
                    </select> */}
                </>
            }
            {
                !searching &&
                <button className="spotifybutton" onClick={() => setSearching(true)}>
                    Choose on Spotify
                </button>
            }
        </>
    );
}

export default NewUploadSongSpotify;