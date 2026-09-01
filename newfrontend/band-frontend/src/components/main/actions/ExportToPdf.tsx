type ExportToPdfProps = {
    exporttopdf: () => Promise<void>;
}

function ExportToPdf({ exporttopdf }: ExportToPdfProps) {
    return (
        <button type="button" onClick={exporttopdf}>
            <div className="buttonlabel">
                Download Setlist to PDF
            </div>
        </button>
    );
}

export default ExportToPdf;