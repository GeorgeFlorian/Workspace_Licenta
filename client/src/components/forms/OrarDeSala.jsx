import { useState } from "react";
import { Autocomplete, TextField, Box, Button, Grid } from "@mui/material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";


const salaOptions = ["B306", "B212", "A101", "A102", "B219a", "B312", "A103", "A05", "B110", "B219b", "A03", "B206a", "B223a", "Sala Orange"];

const OrarDeSala = () => {
  const [sala, setSala] = useState(null);

  const handleSalaChange = (event, value) => {
    setSala(value);
  };

  const handleSubmit = async () => {
    const params = new URLSearchParams({
      sala,
    }).toString();

    try {
      const response = await fetch(`/api/orar-sala?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
        
      const doc = new jsPDF();
  
      // Title styling
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(result.nume, 10, 10);
  
      // Draw a line below the header
      doc.setLineWidth(0.5);
      doc.line(10, 20, 200, 20);
  
      // Prepare the data for the table
      const tableColumn = ["Ora", "Materie"];
      const tableRows = [];
  
      Object.entries(result.program).forEach(([day, entries]) => {
        // Add a row for the day
        tableRows.push([{ content: day, colSpan: 2, styles: { halign: 'center', fillColor: [230, 230, 230] } }]);
        // Add rows for each entry under the day
        entries.forEach(entry => {
          tableRows.push([entry.ora, entry.materie]);
        });
      });

      // Add the table to the PDF
      doc.autoTable({
        startY: 30,
        head: [tableColumn],
        body: tableRows,
        styles: { cellPadding: 3, fontSize: 10 },
        headStyles: { fillColor: [52, 73, 94] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Save the PDF and open it in a new window
      const pdfOutput = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfOutput);
      window.open(pdfUrl);
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Grid container spacing={2} sx={{ width: { sm: "75%", md: "50%"}}}>
        <Grid item xs={12} sm={6} sx={{marginInline: "auto"}}>
          <Autocomplete
            options={salaOptions}
            value={sala}
            onChange={handleSalaChange}
            getOptionLabel={(option) => option}
            renderInput={(params) => <TextField {...params} label="Sala" />}
          />
        </Grid>
        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
          {sala !== null  && (
            <Button variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrarDeSala;
