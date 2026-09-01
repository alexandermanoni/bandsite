import React, { useEffect, useRef, useState } from "react";
import type { Song } from "../../navigation/NewContextManagement";
import DeleteSong from "../actions/DeleteSong";
import NewUploadSong from "../actions/NewUploadSong";
import { ArrowRightFromLine, EllipsisVertical } from "lucide-react";

type NewSongListProps = {
    songs: Song[];
    addSongToSetlist: (id: string) => void;
    uploadSongSource: (song: Song, form: FormData) => Promise<void>; // < this is almost definitely bad
    deleteSong: (id: string) => Promise<void>; // < this too
    selectSong: React.Dispatch<React.SetStateAction<string>>;
}

function NewSongList({ songs, addSongToSetlist, uploadSongSource, deleteSong, selectSong }: NewSongListProps) {
    const [displayOptions, setDisplayOptions] = useState("");
    const optionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setDisplayOptions("");
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, []);

    return (
        <>
            <ul>
                {(songs ?? []).map((song) => (
                    <li
                        className="songlistentry"
                        key={song.id}
                    >
                        {/* only show delete button on desktop */}
                        <div className="desktopview">
                            <DeleteSong songid={song.id} deleteSong={deleteSong} />
                        </div>                 

                        <span style={{ flex: 1 }}>
                            {song.name}
                        </span>
                        
                        {/* only show upload song on desktop */}
                        <div className="desktopview">                        
                            {
                                song.sourcefile
                                ? (
                                    <button 
                                        onClick={() => {
                                            selectSong(song.sourcefile);
                                            // setPlayingSong(song.sourcefile)
                                        }}
                                    >
                                        Play Song
                                    </button>
                                )
                                : (
                                    <NewUploadSong song={song} uploadSongSource={uploadSongSource}/>
                                )
                            }
                        </div>

                        {/* Add song to setlist button */}
                        <button className="desktopview" type="button" onClick={() => addSongToSetlist(song.id)}>
                            Add <ArrowRightFromLine size={ "1rem" } />
                        </button>
                        <button className="mobileview" type="button" onClick={() => addSongToSetlist(song.id)}>
                            <div className="buttonlabel">
                                Add
                            </div>                            
                        </button>

                        {/* Mobile options */}
                        <div className="mobileview optionscontainer" ref={optionsRef}>
                            <div className="mobileview">
                                <button onClick={() => setDisplayOptions(song.id)}>
                                    <div className="buttonlabel">
                                        <EllipsisVertical size={ "1rem" } />
                                    </div>
                                </button>
                            </div>

                            {
                                displayOptions === song.id &&
                                <div className="optionsmenu">
                                    {
                                        song.sourcefile
                                        ? (
                                            <button className="mobileview"
                                                onClick={() => {
                                                    selectSong(song.sourcefile);
                                                    // setPlayingSong(song.sourcefile)
                                                }}
                                            >
                                                Play Song
                                            </button>
                                        )
                                        : (
                                            <NewUploadSong song={song} uploadSongSource={uploadSongSource}/>
                                        )
                                    }
                                    <DeleteSong songid={song.id} deleteSong={deleteSong} />
                                </div>
                            }
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

export default NewSongList;