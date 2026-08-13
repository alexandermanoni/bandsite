type NewCreateBandProps = {
    createBandForContext: (name: string) => Promise<void>;
}

function NewCreateBand({ createBandForContext }: NewCreateBandProps) {
    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        // if form busted somehow
        if (!formData.get("bandNameInput")) return;

        const name = formData.get("bandNameInput")!.toString();

        // empty name
        if (name == "") return;

        createBandForContext(name);

        // reset 
        event.currentTarget.reset();
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                New Band Name: <input name="bandNameInput" type="text" />
            </label>

            <button type="submit">Create Band</button>
        </form>
    );
}

export default NewCreateBand;
