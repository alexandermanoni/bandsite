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
            <input id="upload-song" ref={fileInputRef} type="file" accept="audio/*" onChange={handleSubmit}/>
            <button onClick={handleClick}>
                {!loading && <span>Upload Audio File</span>}
                {loading && <span>Uploading Audio File</span>}
                {/* <span>Upload Audio File</span> */}
            </button>
            {/* <button onClick={() => document.getElementById("upload-song")?.click()}>
                <span>Upload Audio File</span>
            </button> */}
        </>
    );
}

export default NewUploadSong;