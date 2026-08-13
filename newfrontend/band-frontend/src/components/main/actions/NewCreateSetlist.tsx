type NewCreateSetlistProps = {
    createSetlistForContext: (name: string) => Promise<void>;
}

function NewCreateSetlist({ createSetlistForContext }: NewCreateSetlistProps) {
    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // if form busted somehow
        if (!formData.get("setlistNameInput")) return;

        const name = formData.get("setlistNameInput")!.toString();

        // empty name
        if (name == "") return;

        createSetlistForContext(name);

        // reset
        event.currentTarget.reset();
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                New Setlist Name: <input name="setlistNameInput" type="text" />
            </label>

            <button type="submit">Create Setlist</button>
        </form>
    );
}

export default NewCreateSetlist;