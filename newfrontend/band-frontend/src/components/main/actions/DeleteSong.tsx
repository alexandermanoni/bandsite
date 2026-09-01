type DeleteSongProps = {
    songid: string;
    deleteSong: (id: string) => Promise<void>;
}

function DeleteSong({ songid, deleteSong }: DeleteSongProps) {
    const handleDelete = async (songid: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this song?\nThis cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        deleteSong(songid);
    }
    return (
        <>
            {/* <button type="button" onClick={() => deleteSong(songid)}>Delete</button> */}
            <button className="criticalbutton desktopview" type="button" onClick={() => handleDelete(songid)}>
                D
            </button>

            <button className="criticalbutton mobileview" type="button" onClick={() => handleDelete(songid)}>
                Delete
            </button>
        </>
    );
}

export default DeleteSong;