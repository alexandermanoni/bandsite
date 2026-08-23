type NewSaveSetlistProps = {
    savesetlist: () => Promise<void>;
}

function NewSaveSetlist({ savesetlist }: NewSaveSetlistProps) {
    return (
        <button type="button" onClick={savesetlist}>
            <span>Save Setlist</span>
        </button>
    );
}

export default NewSaveSetlist;