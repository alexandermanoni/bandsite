import { useState } from "react";
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
    const [playingSong, setPlayingSong] = useState("");

    return (
        <>
            <ul>
                {(songs ?? []).map((song) => (
                    <li
                        key={song.id}
                    >
                        <DeleteSong songid={song.id} deleteSong={deleteSong} />
                        <span id="songname">
                            {song.name}
                        </span>
                        <div id="buttongroup">
                            <button id="standardbutton" type="button" onClick={() => addSongToSetlist(song.id)}>
                                <span>Add</span>
                            </button>
                            {" "}
                            {
                                song.sourcefile
                                ? (
                                    <button 
                                        id="standardbutton"
                                        onClick={() => {
                                            setPlayingSong(song.sourcefile)
                                        }}
                                    >
                                        <span>Play Audio File</span>
                                    </button>
                                )
                                : (
                                    <NewUploadSong song={song} uploadSongSource={uploadSongSource}/>
                                )
                            }
                        </div>
                    </li>
                ))}
            </ul>

            <AudioPlayer src={playingSong} />
        </>
    );
}

export default NewSongList;