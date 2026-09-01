import type { Song, SongPosition } from "../../navigation/NewContextManagement";

type NewSetlistSongsListProps = {
    songs: Song[];
    songpositions: SongPosition[];
    moveSongUp: (id: string) => void;
    moveSongDown: (id: string) => void;
    removeSong: (id: string) => void;
}

function NewSetlistSongsList({ songs, songpositions, moveSongUp, moveSongDown, removeSong }: NewSetlistSongsListProps) {
    // calculate songs to display for this setlist
    const positionmap = new Map(
        songpositions.map(position => [Number(position.id), Number(position.position)])
    );

    const displayedsongs = songs
        .filter(song => positionmap.has(Number(song.id)))
        .sort((a, b) => positionmap.get(Number(a.id))! - positionmap.get(Number(b.id))!);

    return (
        <>
            <ol>
                {(displayedsongs ?? [])
                    // sort based on position in setlist
                    .map((song) => (
                        <li
                            className="songlistentry"
                            key={song.id}
                        >
                            <span style={{ flex: 1 }}>
                                {song.name}
                            </span>
                            <span className="buttongroup">
                                    <button id="standardbutton" type="button" onClick={() => moveSongUp(song.id)}>
                                        Up
                                    </button>
                                    {"/"}
                                    <button id="standardbutton" type="button" onClick={() => moveSongDown(song.id)}>
                                        Down
                                    </button>
                                    <button className="desktopview" type="button" onClick={() => removeSong(song.id)}>
                                        Remove
                                    </button>
                                    <button className="mobileview" type="button" onClick={() => removeSong(song.id)}>
                                        -
                                    </button>
                                </span>
                        </li>
                    ))}
            </ol>
        </>
    );
}

export default NewSetlistSongsList;