type ExportToPdfProps = {
    exporttopdf: () => Promise<void>;
}

function ExportToPdf({ exporttopdf }: ExportToPdfProps) {
    return (
        <button type="button" onClick={exporttopdf}>Download Setlist to PDF</button>
    );
}

export default ExportToPdf;