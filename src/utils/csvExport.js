export const exportToCSV = (filename, rows) => {
    if (!rows || !rows.length) {
        return;
    }
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
};
