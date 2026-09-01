import { useContext, useState } from "react";
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
import AudioPlayer from "../components/main/tools/AudioPlayer";

export function NewMainPage() {
    const context = useContext(MainContext);

    const [selSongSrc, setSelSongSrc] = useState("");

    return (
        <>
            <h2>Setlist Creation Utility</h2>

            {/* Current band section */}
            <div className="mainpagecontainer desktopview">

                {/* left column */}
                <div style={{ flex: 1 }}>

                    {/* band selector and create/delete */}
                    <div className="bandcontainer">
                        Current Band:
                        <NewBandList bands={context.contextState.bands} selectedBandID={context.contextState.selectedBandID} getBandsFromContext={context.getBands} selectBandForContext={context.selectBand} />
                        <DeleteBand deleteBand={context.deleteCurrentBand} />
                        <NewCreateBand createBandForContext={context.createBand} />
                    </div>

                    {/* list of songs for band */}
                    <NewSongList songs={context.contextState.songs} addSongToSetlist={context.addSongToSetlist} uploadSongSource={context.uploadSongSource} deleteSong={context.deleteSong} selectSong={setSelSongSrc} />

                    {/* create song button */}
                    <div style={{ display: "flex" }}>
                        <NewCreateSong createSongForContext={context.createSong} />
                    </div>
                </div>

                {/* right column */}
                <div style={{ flex: 1 }}>

                    {/* setlist selector and create/delete */}
                    <div className="bandcontainer">
                        Current Setlist:
                        <NewSetlistList setlists={context.contextState.setlists} selectedSetlistID={context.contextState.selectedSetlistID} selectSetlistForContext={context.selectSetlist} />
                        <DeleteSetlist deleteSetlist={context.deleteCurrentSetlist} />
                        <NewCreateSetlist createSetlistForContext={context.createSetlist} />
                    </div>

                    {/* list of songs in setlist */}
                    <NewSetlistSongsList songs={context.contextState.songs} songpositions={context.contextState.songpositions} moveSongUp={context.moveSongUp} moveSongDown={context.moveSongDown} removeSong={context.removeSongFromSetlist} />

                    {/* setlist options */}
                    <div className="buttongroup" style={{ justifyContent: "end" }}>
                        <ExportToPdf exporttopdf={context.getSetlistPdf} />
                        <ExportToZip exporttozip={context.getSetlistZip} />
                        <NewSaveSetlist savesetlist={context.uploadSetlist} />
                    </div>
                </div>
            </div>

            {/* <div className="bandcontainer desktopview">
                    Current Band: 
                    <NewBandList bands={context.contextState.bands} selectedBandID={context.contextState.selectedBandID} getBandsFromContext={context.getBands} selectBandForContext={context.selectBand} />
                    <NewCreateBand createBandForContext={context.createBand} />
                    <DeleteBand deleteBand={context.deleteCurrentBand} />                    
                </div> */}

            <div className="mobileview" style={{ display: "flex", flexDirection: "column" }}>
                <div className="bandcontainer mobileview">
                    <DeleteBand deleteBand={context.deleteCurrentBand} />
                    <NewBandList bands={context.contextState.bands} selectedBandID={context.contextState.selectedBandID} getBandsFromContext={context.getBands} selectBandForContext={context.selectBand} />
                    <NewCreateBand createBandForContext={context.createBand} />

                </div>

                <div className="mobileview">
                    <NewSongList songs={context.contextState.songs} addSongToSetlist={context.addSongToSetlist} uploadSongSource={context.uploadSongSource} deleteSong={context.deleteSong} selectSong={setSelSongSrc} />                </div>
            </div>

            <AudioPlayer src={selSongSrc} />

            {/* <div className="mobileview">
                    <div className="bandcontainer mobileview">
                        <DeleteBand deleteBand={context.deleteCurrentBand} />
                        <NewBandList bands={context.contextState.bands} selectedBandID={context.contextState.selectedBandID} getBandsFromContext={context.getBands} selectBandForContext={context.selectBand} />
                        <NewCreateBand createBandForContext={context.createBand} />
                    </div>

                    <NewSongList songs={context.contextState.songs} addSongToSetlist={context.addSongToSetlist} uploadSongSource={context.uploadSongSource} deleteSong={context.deleteSong} />
                </div> */}

            {/* <div id="maincontent">
                <div>
                    
                    
                    <NewCreateSong createSongForContext={context.createSong} />
                </div>
                <div>
                    <NewCreateSetlist createSetlistForContext={context.createSetlist} />
                    <NewSetlistList setlists={context.contextState.setlists} selectedSetlistID={context.contextState.selectedSetlistID} selectSetlistForContext={context.selectSetlist} />
                    {" "}
                    <DeleteSetlist deleteSetlist={context.deleteCurrentSetlist} />
                    <NewSetlistSongsList songs={context.contextState.songs} songpositions={context.contextState.songpositions} moveSongUp={context.moveSongUp} moveSongDown={context.moveSongDown} removeSong={context.removeSongFromSetlist} />
                    <div id="setlistoptions">
                        <NewSaveSetlist savesetlist={context.uploadSetlist} />
                        <ExportToPdf exporttopdf={context.getSetlistPdf} />
                        <ExportToZip exporttozip={context.getSetlistZip} />
                    </div>
                </div>
            </div> */}
        </>
    );
}