import { useRef, useState } from "react";
import type { Song } from "../../navigation/NewContextManagement";

type NewUploadSongProps = {
    song: Song;
    uploadSongSource: (song: Song, form: FormData) => Promise<void>;
}

function NewUploadSong({ song, uploadSongSource }: NewUploadSongProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.ChangeEvent<HTMLInputElement>) {
        // event.preventDefault();

        const file = event.target.files?.[0];

        if (!file) return;

        // backend needs a form
        const formData = new FormData();
        formData.append("songid", song.id);
        formData.append("songsource", file);

        setLoading(true);

        await uploadSongSource(song, formData);

        setLoading(false);
    }

    function handleClick() {
        fileInputRef.current?.click();
    }

    return (
        <>
            <input className="uploadsong" ref={fileInputRef} type="file" accept="audio/*" onChange={handleSubmit}/>
            { 
                !loading && <button className="postbutton" onClick={handleClick}>Upload Audio File</button>
            }
            {
                loading && <button onClick={() => {}}>Loading...</button>
            }
        </>
    );
}

export default NewUploadSong;