import { useState } from "react";

type NewCreateBandProps = {
    createBandForContext: (name: string) => Promise<void>;
}

function NewCreateBand({ createBandForContext }: NewCreateBandProps) {
    const [creating, setCreating] = useState(false);

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
        <>
            <button onClick={() => {
                const testval = prompt("Enter testval: ");

                console.log("VAL: ", testval);
            }}>
                Test Prompt
            </button>
            {
                creating && 
                <form onSubmit={handleSubmit}>
                <label>
                    New Band: <input name="bandNameInput" type="text" />
                </label>
                {" "}
                <button className="postbutton" type="submit">
                    <div className="buttonlabel">
                        Create Band
                    </div>
                </button>
                <button onClick={() => setCreating(false)}>
                    <div className="buttonlabel">
                        Cancel
                    </div>
                </button>
            </form>
            }
            {
                !creating && 
                <button onClick={() => setCreating(true)} style={{ justifySelf: "right" }}>
                    <div className="buttonlabel">
                        Create Band
                    </div>
                </button>
            }
        </>
    );
}

export default NewCreateBand;
