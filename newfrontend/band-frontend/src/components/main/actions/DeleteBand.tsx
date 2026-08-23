type DeleteBandProps = {
    deleteBand: () => Promise<void>;
}

function DeleteBand({ deleteBand }: DeleteBandProps) {
    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this setlist? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        deleteBand();
    }
    return (
        <>
            <button id="criticalbutton" type="button" onClick={handleDelete}>
                <span>Delete Current Band</span>
            </button>
        </>
    );
}

export default DeleteBand;