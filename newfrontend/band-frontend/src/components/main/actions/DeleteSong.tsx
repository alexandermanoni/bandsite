type DeleteSongProps = {
    songid: string;
    deleteSong: (id: string) => Promise<void>;
}

function DeleteSong({ songid, deleteSong }: DeleteSongProps) {
    const handleDelete = async (songid: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this song? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        deleteSong(songid);
    }
    return (
        <>
            {/* <button type="button" onClick={() => deleteSong(songid)}>Delete</button> */}
            <button id="criticalbutton" type="button" onClick={() => handleDelete(songid)}>
                <span>Delete</span>
            </button>
        </>
    );
}

export default DeleteSong;