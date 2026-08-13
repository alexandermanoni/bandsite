type NewCreateSongProps = {
    createSongForContext: (name: string) => Promise<void>;
}

function NewCreateSong({ createSongForContext }: NewCreateSongProps) {
    function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // if form busted somehow
        if (!formData.get("songNameInput")) return;

        const name = formData.get("songNameInput")!.toString();

        // empty name
        if (name == "") return;

        createSongForContext(name);

        // reset
        event.currentTarget.reset();
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                New Song Name: <input name="songNameInput" type="text" />
            </label>

            <button type="submit">Create Song</button>
        </form>
    );
}

export default NewCreateSong;