import { Trash2 } from "lucide-react";

type DeleteSetlistProps = {
    deleteSetlist: () => Promise<void>;
}

function DeleteSetlist({ deleteSetlist }: DeleteSetlistProps) {
    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete the current setlist?\nThis cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        deleteSetlist();
    }
    return (
        <>
            <button className="criticalbutton" onClick={handleDelete}>
                <div className="buttonlabel">
                    <Trash2 size={ "1rem" }/>
                </div>
                {/* <div className="buttonlabel desktopview">
                    Delete Setlist
                </div>
                <div className="buttonlabel mobileview">
                    D
                </div> */}
            </button>
        </>
    );
}

export default DeleteSetlist;