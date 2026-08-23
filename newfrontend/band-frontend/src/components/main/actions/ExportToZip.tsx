type ExportToZipProps = {
    exporttozip: () => Promise<void>;
}

function ExportToZip({ exporttozip }: ExportToZipProps) {
    return (
        <button id="standardbutton" type="button" onClick={exporttozip}>
            <span>Download Setlist to ZIP</span>
        </button>
    );
}

export default ExportToZip;