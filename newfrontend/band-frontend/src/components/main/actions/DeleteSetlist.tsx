type DeleteSetlistProps = {
    deleteSetlist: () => Promise<void>;
}

function DeleteSetlist({ deleteSetlist }: DeleteSetlistProps) {
    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this setlist? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        deleteSetlist();
    }
    return (
        <>
            <button type="button" onClick={handleDelete}>Delete Current Setlist</button>
        </>
    );
}

export default DeleteSetlist;