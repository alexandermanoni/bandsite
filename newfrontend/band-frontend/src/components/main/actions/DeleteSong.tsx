import { Trash2 } from "lucide-react";

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
            <button className="criticalbutton desktopview" type="button" onClick={() => handleDelete(songid)}>
                <Trash2 size={ "1rem" }/>
            </button>

            <button className="criticalbutton mobileview" type="button" onClick={() => handleDelete(songid)}>
                <div className="buttonlabel">
                    <Trash2 size={"1rem"} />{" "}
                    Delete
                </div>                
            </button>
        </>
    );
}

export default DeleteSong;