type ExportToZipProps = {
    exporttozip: () => Promise<void>;
}

function ExportToZip({ exporttozip }: ExportToZipProps) {
    return (
        <button type="button" onClick={exporttozip}>Download Setlist to ZIP</button>
    );
}

export default ExportToZip;