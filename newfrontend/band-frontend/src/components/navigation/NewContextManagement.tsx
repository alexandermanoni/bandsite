import { createContext, useEffect, useState } from "react";
import { apiFetch } from "../../api/api";

// used for bands/setlists since they're the same
export type GenericItem = {
    id: string;
    name: string;
}

export type Song = {
    id: string;
    name: string;
    sourcefile: string;
}

export type SongPosition = {
    id: string;
    position: string;
}

export interface ContextModel {
    readonly bands: GenericItem[];
    readonly songs: Song[];
    readonly setlists: GenericItem[];
    readonly songpositions: SongPosition[];

    readonly selectedBandID: string;
    readonly selectedSetlistID: string;
}

export type ContextState = {
    readonly contextState: ContextModel;

    getBands: () => Promise<GenericItem[]>;
    getSetlistPdf: () => Promise<void>;
    getSetlistZip: () => Promise<void>;

    selectBand: (id: string) => void;
    selectSetlist: (id: string) => void;

    createBand: (name: string) => Promise<void>;
    createSong: (name: string) => Promise<void>;
    createSetlist: (name: string) => Promise<void>;
    uploadSongSource: (song: Song, form: FormData) => Promise<void>;
    uploadSetlist: () => Promise<void>;

    deleteCurrentBand: () => Promise<void>;
    deleteCurrentSetlist: () => Promise<void>;
    deleteSong: (id: string) => Promise<void>;

    moveSongUp: (id: string) => void;
    moveSongDown: (id: string) => void;
    addSongToSetlist: (id: string) => void;
    removeSongFromSetlist: (id: string) => void;
}

export const MainContext = createContext<ContextState>(null!);

export function ContextProvider({ children }: { children: React.ReactNode; }) {
    //const { user } = useAuth();

    const [contextState, setContextState] = useState<ContextModel>({
        bands: [],
        songs: [],
        setlists: [],
        songpositions: [],
        selectedBandID: "",
        selectedSetlistID: "",
    });

    async function getBands() {
        // if bands are loaded, return them
        if (contextState.bands != null && contextState.bands.length > 0) {
            return contextState.bands;
        }

        // load bands
        const response = await apiFetch("bandlist");

        if (!response.ok) {
            console.error("Failed to get bands!");
            return [];
        }

        const result = await response.json();

        // set new state
        setContextState({
            bands: result,

            // everything becomes null since loading new bands resets all
            songs: [],
            setlists: [],
            songpositions: [],
            selectedBandID: "",
            selectedSetlistID: "",
        });

        return contextState.bands;
    }

    async function getSetlistPdf() {
        const response = await apiFetch(`setlistpdf/${contextState.selectedSetlistID}`);

        if (!response.ok) {
            console.error("Failed to download pdf for setlist: ", contextState.selectedSetlistID);
            return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "setlist.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    async function getSetlistZip() {
        const response = await apiFetch(`setlistzip/${contextState.selectedSetlistID}`);

        if (!response.ok) {
            console.error("Failed to download zip for setlist: ", contextState.selectedSetlistID);
            return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "setlist.zip";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    // get the songs a band has
    async function getSongs() {
        // fetch song names and ids
        const response = await apiFetch(`songs/${contextState.selectedBandID}`);

        if (!response.ok) {
            console.error("Failed to load songs for band: ", contextState.selectedBandID);
            return;
        }

        let newsongs: Song[] = await response.json();

        if (newsongs == null) {
            setContextState((prev) => ({
                ...prev,
                songs: []
            }));

            return;
        }

        // get sourcefiles for songs that have them
        await Promise.all(
            newsongs.map(async (song) => {
                const response = await apiFetch(`songsources/${song.id}`);

                if (!response.ok) return;

                song.sourcefile = URL.createObjectURL(await response.blob());
            })
        );

        // set new song state
        setContextState((prev) => ({
            ...prev,

            songs: newsongs
        }));
    }

    async function getSetlists() {
        // fetch setlist names and ids
        const response = await apiFetch(`setlists/${contextState.selectedBandID}`);

        if (!response.ok) {
            console.error("Failed to load setlists for band: ", contextState.selectedBandID);
            return;
        }

        let newsetlists: GenericItem[] = await response.json();

        if (newsetlists == null) {
            setContextState((prev) => ({
                ...prev,
                setlists: []
            }));

            return;
        }

        // set new setlists state
        setContextState((prev) => ({
            ...prev,

            setlists: newsetlists
        }));
    }

    async function getSongPositions() {
        const response = await apiFetch(`songpositions/${contextState.selectedSetlistID}`);

        if (!response.ok) {
            console.error("Failed to load songs for setlist: ", contextState.selectedSetlistID);
            return;
        }

        let newsongpositions: SongPosition[] = await response.json();

        if (newsongpositions == null) {
            setContextState((prev) => ({
                ...prev,
                songpositions: []
            }));

            return;
        }

        setContextState((prev) => ({
            ...prev,
            songpositions: newsongpositions
        }));
    }

    function selectBand(id: string) {
        // check that that id exists
        const exists = contextState.bands.some(band => band.id == id);

        // don't do anything if doesn't exist or is already selected
        if (!exists || id == contextState.selectedBandID) {
            return;
        }

        // set selected band id
        setContextState((prev) => ({
            ...prev,

            selectedBandID: id,

            // reset songs, setlists, selected setlist            
            songs: [],
            setlists: [],
            selectedSetlistID: "",
        }));
    }

    function selectSetlist(id: string) {
        const exists = contextState.setlists.some(setlist => setlist.id == id);

        if (!exists || id == contextState.selectedSetlistID) {
            return;
        }

        // set selected setlist
        setContextState((prev) => ({
            ...prev,
            selectedSetlistID: id
        }));
    }

    async function createBand(name: string) {
        // create band
        const requestBody = { newbandname: name };
        const response = await apiFetch("createband", { 
            method: "POST", 
            body: JSON.stringify(requestBody) 
        });

        if (!response.ok) {
            console.log(`Failed to create band ${name}`);
            return;
        }

        // get new id
        const result = await response.json();

        if (!result) return;

        // add new band without reloading
        setContextState((prev) => ({
            ...prev,
            bands: [...contextState.bands, result],
            selectedBandID: result.id
        }));
    }

    async function createSong(name: string) {
        // create song
        const requestBody = { bandid: contextState.selectedBandID.toString(), newsongname: name };
        const response = await apiFetch("createsong", { method: "POST", body: JSON.stringify(requestBody) });

        if (!response.ok) {
            console.log(`Failed to create song ${name} for band ${contextState.selectedBandID}`);
            return;
        }

        // get new song
        let newsong: Song = await response.json();

        if (!newsong) return;

        // add new song without reloading
        setContextState((prev) => ({
            ...prev,
            songs: [...contextState.songs, newsong]
        }));
    }

    async function createSetlist(name: string) {
        // create setlist
        const requestBody = { bandid: contextState.selectedBandID.toString(), newsetlistname: name };
        const response = await apiFetch("createsetlist", { method: "POST", body: JSON.stringify(requestBody) });

        if (!response.ok) {
            console.log(`Filed to create setlist ${name} for band ${contextState.selectedBandID}`);
            return;
        }

        let newsetlist: GenericItem = await response.json();

        if (!newsetlist) return;

        // add new setlist without reloading
        setContextState((prev) => ({
            ...prev,
            setlists: [...contextState.setlists, newsetlist],
            selectedSetlistID: newsetlist.id
        }));
    }

    async function uploadSongSource(song: Song, form: FormData) {
        const result = await apiFetch("uploadsong", { method: "POST", body: form });
        console.log("Temp fix for gcp: ", song);

        if (!result.ok) return;

        // reload songs
        getSongs();
    }

    async function uploadSetlist() {
        // this might be overkill
        const positions = new Map(
            contextState.songpositions.map(p => [p.id, p.position])
        );

        const combined = contextState.songs
            .filter(song => positions.has(song.id))
            .map(song => ({
                ...song,
                position: positions.get(song.id)!
            }));

        const result = await apiFetch("uploadsongpositions", { method: "POST", body: JSON.stringify({ setlistid: contextState.selectedSetlistID.toString(), songpositions: combined })});

        if (!result.ok) return;
    }

    async function deleteCurrentBand() {
        if (!contextState.selectedBandID) return;

        const response = await apiFetch(`deleteband/${contextState.selectedBandID.toString()}`, { method: "POST" });

        if (!response.ok) {
            console.log("Failed to delete selected band: ", contextState.selectedBandID);
            return;
        }

        const newbandlist = contextState.bands.filter(s => s.id.toString() !== contextState.selectedBandID.toString());

        setContextState((prev) => ({
            ...prev,
            bands: newbandlist,
            selectedBandID: "",
            songs: [],
            setlists: [],
        }));
    }

    async function deleteCurrentSetlist() {
        if (!contextState.selectedSetlistID) return;

        const response = await apiFetch(`deletesetlist/${contextState.selectedSetlistID.toString()}`, { method: "POST" });

        if (!response.ok) {
            console.log("Failed to delete selected setlist: ", contextState.selectedSetlistID);
            return;
        }

        // double check this
        const newsetlistlist = contextState.setlists.filter(s => s.id.toString() !== contextState.selectedSetlistID);

        setContextState((prev) => ({
            ...prev,
            setlists: newsetlistlist,
            selectedSetlistID: ""
        }));
    }

    async function deleteSong(id: string) {
        if (!id) return;

        const response = await apiFetch(`deletesong/${id.toString()}`, { method: "POST" });

        if (!response.ok) {
            console.log("Failed to delete song: ", id);
            return;
        }

        console.log("Songs: ", contextState.songs);

        const newsonglist = contextState.songs.filter(s => s.id.toString() !== id.toString());

        setContextState((prev) => ({
            ...prev,
            songs: newsonglist
        }));

        removeSongFromSetlist(id);
    }

    function moveSongUp(id: string) {
        const updatedpositions: SongPosition[] = JSON.parse(JSON.stringify(contextState.songpositions));

        const currentsong = updatedpositions.find(p => p.id === id);
        if (!currentsong || Number(currentsong.position) === 1) {
            return;
        }

        const above = updatedpositions.find(p => Number(p.position) === Number(currentsong.position) - 1);

        if (!above) {
            return;
        }

        [currentsong.position, above.position] = [above.position, currentsong.position];

        setContextState((prev) => ({
            ...prev,
            songpositions: updatedpositions
        }));
    }

    function moveSongDown(id: string) {
        const updatedpositions: SongPosition[] = JSON.parse(JSON.stringify(contextState.songpositions));

        const currentsong = updatedpositions.find(p => p.id === id);
        if (!currentsong || Number(currentsong.position) === updatedpositions.length) {
            return;
        }

        const below = updatedpositions.find(p => Number(p.position) === Number(currentsong.position) + 1);

        if (!below) {
            return;
        }

        [below.position, currentsong.position] = [currentsong.position, below.position];

        setContextState((prev) => ({
            ...prev,
            songpositions: updatedpositions
        }));
    }

    function addSongToSetlist(id: string) {
        const songinlist = contextState.songpositions.find(p => p.id === id);
        if (songinlist) return;

        let updatedpositions: SongPosition[] = JSON.parse(JSON.stringify(contextState.songpositions));

        let newsong: SongPosition = { id: id, position: (updatedpositions.length + 1).toString() };
        updatedpositions.push(newsong);

        setContextState((prev) => ({
            ...prev,
            songpositions: updatedpositions
        }));
    }

    function removeSongFromSetlist(id: string) {
        // get song position
        const position = contextState.songpositions.find(p => p.id === id)?.position;

        if (!position) return;

        const updatedpositions = contextState.songpositions
            // get everything but removal item
            .filter(song => song.position !== position)
            // update positions for songs with greater positions
            .map(song => ({
                ...song,
                position: song.position > position
                    ? (Number(song.position) - 1).toString()
                    : song.position
            }));

        setContextState((prev) => ({
            ...prev,
            songpositions: updatedpositions
        }));
    }

    // load songs whenever the band changes
    useEffect(() => {
        const load = async () => {
            // this shouldn't be needed, but selectedBandID is changing initially somehow
            if (!contextState.selectedBandID) return;
            await getSongs();
            await getSetlists();
        };

        load();
        
    }, [contextState.selectedBandID]);

    // set selected band to first one initially
    // this might mess up createband since it's modifying bands and trying to set selected band
    useEffect(() => {
        if (contextState.bands == null) return;

        if (contextState.bands.length > 0 && contextState.selectedBandID == "") {
            setContextState((prev) => ({
                ...prev,
                selectedBandID: contextState.bands[0].id
            }));
        }
    }, [contextState.bands]);

    useEffect(() => {
        const load = async () => {
            if (contextState.selectedSetlistID == "") {
                return;
            }

            await getSongPositions();
        }
        load();
    }, [contextState.selectedSetlistID]);

    useEffect(() => {
        if (contextState.setlists.length > 0 && contextState.selectedSetlistID == "") {
            setContextState((prev) => ({
                ...prev,
                selectedSetlistID: contextState.setlists[0].id
            }));
        }
    }, [contextState.setlists]);

    return (
        <MainContext.Provider
            value={{
                contextState,

                getBands,
                getSetlistPdf,
                getSetlistZip,

                selectBand,
                selectSetlist,

                createBand,
                createSong,
                createSetlist,
                uploadSongSource,
                uploadSetlist,

                deleteCurrentBand,
                deleteCurrentSetlist,
                deleteSong,

                moveSongUp,
                moveSongDown,
                addSongToSetlist,
                removeSongFromSetlist
            }}
        >
            {children}
        </MainContext.Provider>
    )
}