type NewSaveSetlistProps = {
    savesetlist: () => Promise<void>;
}

function NewSaveSetlist({ savesetlist }: NewSaveSetlistProps) {
    return (
        <>
            <button className="postbutton desktopview" type="button" onClick={savesetlist}>
                <div className="buttonlabel">Save Setlist</div>
            </button>
            <button className="postbutton mobileview" type="button" onClick={savesetlist}>
                <div className="buttonlabel">Save</div>
            </button>
        </>
    );
}

export default NewSaveSetlist;