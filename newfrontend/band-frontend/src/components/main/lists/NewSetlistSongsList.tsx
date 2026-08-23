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
                            key={song.id}
                        >
                            <div id="listrow">
                                <span id="songname">
                                    {song.name}
                                </span>
                                <span id="buttongroup">
                                    <button id="standardbutton" type="button" onClick={() => moveSongUp(song.id)}>
                                        <span>Up</span>
                                    </button>
                                    {" / "}
                                    <button id="standardbutton" type="button" onClick={() => moveSongDown(song.id)}>
                                        <span>Down</span>
                                    </button>
                                    {" "}
                                    <button id="standardbutton" type="button" onClick={() => removeSong(song.id)}>
                                        <span>Remove</span>
                                    </button>
                                </span>
                            </div>
                        </li>
                    ))}
            </ol>
        </>
    );
}

export default NewSetlistSongsList;