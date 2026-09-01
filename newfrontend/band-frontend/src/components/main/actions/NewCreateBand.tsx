import { useState } from "react";

type NewCreateBandProps = {
    createBandForContext: (name: string) => Promise<void>;
}

function NewCreateBand({ createBandForContext }: NewCreateBandProps) {
    const [creating, setCreating] = useState(false);

    async function handleCreateBand() {
        const bandName = prompt("Enter a name for the new band:");

        // user cancelled or input an empty name
        if (!bandName || bandName?.trim() == "") return;

        setCreating(true);
        await createBandForContext(bandName!);
        setCreating(false);
    }

    return (
        <>
            {
                creating &&
                <button className="postbutton" onClick={() => {}}>
                    <div className="buttonlabel desktopview">
                        Creating...
                    </div>
                    <div className="buttonlabel mobileview">
                        @
                    </div>
                </button>
            }
            {
                !creating &&
                <button className="postbutton" onClick={handleCreateBand}>
                    <div className="buttonlabel desktopview">
                        Create Band
                    </div>
                    <div className="buttonlabel mobileview">
                        +
                    </div>
                </button>
            }
        </>
    );
}

export default NewCreateBand;
