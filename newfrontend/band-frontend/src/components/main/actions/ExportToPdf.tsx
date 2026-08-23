type ExportToPdfProps = {
    exporttopdf: () => Promise<void>;
}

function ExportToPdf({ exporttopdf }: ExportToPdfProps) {
    return (
        <button id="standardbutton" type="button" onClick={exporttopdf}>
            <span>Download Setlist to PDF</span>
        </button>
    );
}

export default ExportToPdf;