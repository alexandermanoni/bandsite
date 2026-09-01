type ExportToZipProps = {
    exporttozip: () => Promise<void>;
}

function ExportToZip({ exporttozip }: ExportToZipProps) {
    return (
        <button type="button" onClick={exporttozip}>
            <div className="buttonlabel">
                Download Setlist to ZIP
            </div>
        </button>
    );
}

export default ExportToZip;