import { Hourglass, Plus } from "lucide-react";
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
                    <div className="desktopview">
                        Creating...
                    </div>
                    <div className="mobileview">
                        <Hourglass size={ "1rem" } />
                    </div>
                </button>
            }
            {
                !creating &&
                <button className="postbutton" onClick={handleCreateBand}>
                    <div className="desktopview buttonlabel">
                        Create Band
                    </div>
                    <div className="mobileview buttonlabel">
                        <Plus size={ "1rem" } />
                    </div>
                </button>
            }
        </>
    );
}

export default NewCreateBand;
