import type { Song } from "../../navigation/NewContextManagement";
import DeleteSong from "../actions/DeleteSong";
import NewUploadSong from "../actions/NewUploadSong";
import AudioPlayer from "../tools/AudioPlayer";

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
                        <button id="standardbutton" type="button" onClick={() => addSongToSetlist(song.id)}>
                            <span>Add</span>
                        </button>
                        {" "}
                        {
                            song.sourcefile
                            ? (
                                <AudioPlayer src={song.sourcefile} />
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