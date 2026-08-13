import type { Song } from "../../navigation/NewContextManagement";
import DeleteSong from "../actions/DeleteSong";
import NewUploadSong from "../actions/NewUploadSong";

type NewSongListProps = {
    songs: Song[];
    addSongToSetlist: (id: string) => void;
    uploadSongSource: (song: Song, form: FormData) => Promise<void>; // < this is almost definitely bad
    deleteSong: (id: string) => Promise<void>; // < this too
}

function NewSongList({ songs, addSongToSetlist, uploadSongSource, deleteSong }: NewSongListProps) {
    return (
        <>
            <ul>
                {(songs ?? []).map((song) => (
                    <li
                        key={song.id}
                    >
                        <DeleteSong songid={song.id} deleteSong={deleteSong} />
                        {" "}
                        {song.name}
                        {" "}
                        <button type="button" onClick={() => addSongToSetlist(song.id)}>Add</button>
                        {" "}
                        {
                            song.sourcefile
                            ? (
                                <audio controls>
                                    <source src={song.sourcefile} />
                                    Your browser doesn't support audio playback.
                                </audio>
                            )
                            : (
                                <NewUploadSong song={song} uploadSongSource={uploadSongSource}/>
                            )
                        }
                    </li>
                ))}
            </ul>
        </>
    );
}

export default NewSongList;