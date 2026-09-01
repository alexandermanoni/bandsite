import type { GenericItem } from "../../navigation/NewContextManagement"

type NewSetlistListProps = {
    setlists: GenericItem[];
    selectedSetlistID: string | null;
    selectSetlistForContext: (id: string) => void;
}

// returns dropdown list of bands user is a member of
function NewSetlistList({ setlists, selectedSetlistID, selectSetlistForContext }: NewSetlistListProps) {
    function selectSetlist(e: React.ChangeEvent<HTMLSelectElement>) {
        selectSetlistForContext(e.target.value);
    }

    return (
        <>
            <select className="dropdown" name="setlistdropdown" onChange={selectSetlist} value={selectedSetlistID!}>
                {(setlists ?? []).map((setlist) => (
                    <option key={setlist.id} value={setlist.id}>{setlist.name}</option>
                ))}
            </select>
        </>
    );
}

export default NewSetlistList;