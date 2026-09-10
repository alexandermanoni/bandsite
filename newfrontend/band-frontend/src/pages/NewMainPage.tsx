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
import SpotifyProfileViewer from "../components/main/tools/SpotifyProfileViewer";
import UploadSongSpotify from "../components/main/actions/UploadSongSpotify";

export function NewMainPage() {
    const context = useContext(MainContext);

    const [selSongSrc, setSelSongSrc] = useState("");
    const [activeTab, setActiveTab] = useState("songs");

    return (
        <>
            <h2>Setlist Creation Utility</h2>

            {/* Main page desktop view */}
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
                    <NewSongList songs={context.contextState.songs} addSongToSetlist={context.addSongToSetlist} uploadSongSource={context.uploadSongSource} uploadSongSpotify={context.uploadSongSpotify} deleteSong={context.deleteSong} selectSong={setSelSongSrc} />

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

            {/* Main page mobile view */}
            <div className="mobilemaincontainer mobileview">

                {/* band selector and create/delete */}
                <div className="bandcontainer">
                    <DeleteBand deleteBand={context.deleteCurrentBand} />
                    <NewBandList bands={context.contextState.bands} selectedBandID={context.contextState.selectedBandID} getBandsFromContext={context.getBands} selectBandForContext={context.selectBand} />
                    <NewCreateBand createBandForContext={context.createBand} />
                </div>

                {/* tab selector */}
                <div className="tabcontainer">
                    <div className={activeTab === "songs" ? "active" : ""} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setActiveTab("songs")}>
                        Songs
                    </div>
                    <div className={activeTab === "setlists" ? "active" : ""} style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setActiveTab("setlists")}>
                        Setlists
                    </div>
                </div>

                {/* on song tab */}
                {
                    activeTab === "songs" &&
                    <div className="mobilemaincontainer" style={{ gap: "0rem", }}>
                        <NewSongList songs={context.contextState.songs} addSongToSetlist={context.addSongToSetlist} uploadSongSource={context.uploadSongSource} deleteSong={context.deleteSong} selectSong={setSelSongSrc} />
                        <NewCreateSong createSongForContext={context.createSong} />
                    </div>
                }

                {/* on setlist tab */}
                {
                    activeTab === "setlists" &&
                    <div>
                        {/* setlist selector and create/delete */}
                        <div className="bandcontainer">
                            <DeleteSetlist deleteSetlist={context.deleteCurrentSetlist} />
                            <NewSetlistList setlists={context.contextState.setlists} selectedSetlistID={context.contextState.selectedSetlistID} selectSetlistForContext={context.selectSetlist} />
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
                }
            </div>

            <SpotifyProfileViewer />
            <UploadSongSpotify />
            <AudioPlayer src={selSongSrc} />
        </>
    );
}