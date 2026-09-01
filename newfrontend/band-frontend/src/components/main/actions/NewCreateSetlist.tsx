import { Hourglass, Plus } from "lucide-react";
import { useState } from "react";

type NewCreateSetlistProps = {
    createSetlistForContext: (name: string) => Promise<void>;
}

function NewCreateSetlist({ createSetlistForContext }: NewCreateSetlistProps) {
    const [creating, setCreating] = useState(false);

    async function handleCreateSetlist() {
        const setlistName = prompt("Enter a name for the new setlist:");

        // user cancelled or input an empty name
        if (!setlistName || setlistName?.trim() == "") return;

        setCreating(true);
        await createSetlistForContext(setlistName!);
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
                <button className="postbutton" onClick={handleCreateSetlist}>
                    <div className="desktopview buttonlabel">
                        Create Setlist
                    </div>
                    <div className="mobileview buttonlabel">
                        <Plus size={ "1rem" } />
                    </div>
                </button>
            }
        </>
    );
}

export default NewCreateSetlist;