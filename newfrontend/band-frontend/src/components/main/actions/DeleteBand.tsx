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
                    D
                </div>
                {/* <div className="buttonlabel desktopview">
                    Delete Band
                </div>
                <div className="buttonlabel mobileview">
                    D
                </div> */}
            </button>
        </>
    );
}

export default DeleteBand;