import { useEffect } from "react";
import type { GenericItem } from "../../navigation/NewContextManagement"

type NewBandListProps = {
    bands: GenericItem[];
    selectedBandID: string;
    getBandsFromContext: () => Promise<GenericItem[]>;
    selectBandForContext: (id: string) => void;
}

// returns dropdown list of bands user is a member of
function NewBandList({ bands, selectedBandID, getBandsFromContext, selectBandForContext }: NewBandListProps) {
    function selectBand(e: React.ChangeEvent<HTMLSelectElement>) {
        selectBandForContext(e.target.value);
    }

    // on first render, tell context to get bands for this user
    useEffect(() => {
        function loadBands() {
            getBandsFromContext();
        }

        loadBands();
    }, []);

    return (
        <>
            <label>Select Band:</label>{" "}
            <select name="banddropdown" id="banddropdown" onChange={selectBand} value={selectedBandID}>
                {(bands ?? []).map((band) => (
                    <option key={band.id} value={band.id}>{band.name}</option>
                ))}
            </select>
        </>
    );
}

export default NewBandList;