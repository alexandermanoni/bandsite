import { Trash2 } from "lucide-react";

type DeleteBandProps = {
    deleteBand: () => Promise<void>;
}

function DeleteBand({ deleteBand }: DeleteBandProps) {
    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete the current band?\nThis cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        deleteBand();
    }
    return (
        <>
            <button className="criticalbutton" onClick={handleDelete}>
                <div className="buttonlabel">
                    <Trash2 size={ "1rem" } />
                </div>                
            </button>
        </>
    );
}

export default DeleteBand;