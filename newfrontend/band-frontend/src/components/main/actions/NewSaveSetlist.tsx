type NewSaveSetlistProps = {
    savesetlist: () => Promise<void>;
}

function NewSaveSetlist({ savesetlist }: NewSaveSetlistProps) {
    return (
        <>
            <button className="postbutton desktopview" type="button" onClick={savesetlist}>
                Save Setlist
            </button>
            <button className="postbutton mobileview" type="button" onClick={savesetlist}>
                Save
            </button>
        </>
    );
}

export default NewSaveSetlist;