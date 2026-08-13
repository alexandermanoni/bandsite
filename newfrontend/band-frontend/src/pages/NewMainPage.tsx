import { useContext } from "react";
import { MainContext } from "../components/navigation/NewContextManagement";
import NewBandList from "../components/main/lists/NewBandList";
import NewSongList from "../components/main/lists/NewSongList";
import NewSetlistList from "../components/main/lists/NewSetlistList";
import NewCreateBand from "../components/main/actions/NewCreateBand";
import NewSetlistSongsList from "../components/main/lists/NewSetlistSongsList";
import NewCreateSong from "../components/main/actions/NewCreateSong";
import NewCreateSetlist from "../components/main/actions/NewCreateSetlist";
import DeleteSetlist from "../components/main/actions/DeleteSetlist";
import NewSaveSetlist from "../components/main/actions/NewSaveSetlist";
import DeleteBand from "../components/main/actions/DeleteBand";
import ExportToZip from "../components/main/actions/ExportToZip";
import ExportToPdf from "../components/main/actions/ExportToPdf";

export function NewMainPage() {
    const context = useContext(MainContext);

    return (
        <>
            <h1>Setlist Creation Utility</h1>
            <div id="maincontent">
                <div>
                    <NewCreateBand createBandForContext={context.createBand} />
                    <NewBandList bands={context.contextState.bands} selectedBandID={context.contextState.selectedBandID} getBandsFromContext={context.getBands} selectBandForContext={context.selectBand} />
                    {" "}
                    <DeleteBand deleteBand={context.deleteCurrentBand} />
                    <NewSongList songs={context.contextState.songs} addSongToSetlist={context.addSongToSetlist} uploadSongSource={context.uploadSongSource} deleteSong={context.deleteSong} />
                    <NewCreateSong createSongForContext={context.createSong} />
                </div>
                <div>
                    <NewCreateSetlist createSetlistForContext={context.createSetlist} />
                    <NewSetlistList setlists={context.contextState.setlists} selectedSetlistID={context.contextState.selectedSetlistID} selectSetlistForContext={context.selectSetlist} />
                    {" "}
                    <DeleteSetlist deleteSetlist={context.deleteCurrentSetlist} />
                    <NewSetlistSongsList songs={context.contextState.songs} songpositions={context.contextState.songpositions} moveSongUp={context.moveSongUp} moveSongDown={context.moveSongDown} removeSong={context.removeSongFromSetlist} />
                    <NewSaveSetlist savesetlist={context.uploadSetlist} />
                    {" "}
                    <ExportToPdf exporttopdf={context.getSetlistPdf} />
                    {" "}
                    <ExportToZip exporttozip={context.getSetlistZip} />
                </div>
            </div>
        </>
    );
}