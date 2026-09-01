type NewSaveSetlistProps = {
    savesetlist: () => Promise<void>;
}

function NewSaveSetlist({ savesetlist }: NewSaveSetlistProps) {
    return (
        <button className="postbutton" type="button" onClick={savesetlist}>
            Save Setlist
        </button>
    );
}

export default NewSaveSetlist;