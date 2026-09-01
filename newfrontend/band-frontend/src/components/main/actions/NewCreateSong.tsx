import { useState } from "react";

type NewCreateSongProps = {
    createSongForContext: (name: string) => Promise<void>;
}

function NewCreateSong({ createSongForContext }: NewCreateSongProps) {
    const [creating, setCreating] = useState(false);

    async function handleCreateSong() {
        const songName = prompt("Enter a name for the new song:");

        // user cancelled or input an empty name
        if (!songName || songName?.trim() == "") return;

        setCreating(true);
        await createSongForContext(songName!);
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
                <button className="postbutton" onClick={handleCreateSong} style={{ marginLeft: "auto" }}>
                    <div className="buttonlabel desktopview">
                        Create Song
                    </div>
                    <div className="buttonlabel mobileview">
                        +
                    </div>
                </button>
            }
        </>
        // <form onSubmit={handleSubmit}>
        //     <label>
        //         New Song: <input name="songNameInput" type="text" />
        //     </label>
        //     {" "}
        //     <button type="submit">
        //         <span>Create Song</span>
        //     </button>
        // </form>
    );
}

export default NewCreateSong;