import type { Song } from "../../navigation/NewContextManagement";

type NewUploadSongProps = {
    song: Song;
    uploadSongSource: (song: Song, form: FormData) => Promise<void>;
}

function NewUploadSong({ song, uploadSongSource }: NewUploadSongProps) {
    function handleSubmit(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();

        const file = event.target.files?.[0];

        if (!file) return;

        // backend needs a form
        const formData = new FormData();
        formData.append("songid", song.id);
        formData.append("songsource", file);

        uploadSongSource(song, formData);
    }
    return (
        <input id="upload-song" name="uploadsong" type="file" accept="audio/*" onChange={handleSubmit}/>
    );
}

export default NewUploadSong;