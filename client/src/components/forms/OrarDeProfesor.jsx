import { useState } from "react";
import { Autocomplete, TextField, Box, Button, Grid } from "@mui/material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";


const profesorOptions = ["M. Frunzete", "T. Petrescu", "A. Bordianu", "A. Niță", "D. Ionita", "R. Purnichescu", "B. Ionescu", "V. Paltanea", "M. Stafe", "H. Cucu"];

const OrarDeProfesor = () => {
  const [profesor, setProfesor] = useState(null);

  const handleProfesorChange = (event, value) => {
    setProfesor(value);
  };

  const handleSubmit = async () => {
    const params = new URLSearchParams({
      profesor,
    }).toString();

    try {
      const response = await fetch(`/api/orar-profesor?${params}`, {
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
      const tableColumns = ["Zi", "An", "Materie", "Ora", "Sala"];
      const tableRows = [];
  
      let lastDay = null; // Variable to store the last processed day
  
      Object.entries(result.program).forEach(([day, entries]) => {
        entries.forEach((entry, index) => {
          // Add the day only for the first entry of each day
          if (index === 0 || day !== lastDay) {
            tableRows.push([
              { content: day, rowSpan: entries.length, styles: { halign: 'center', fillColor: [230, 230, 230] } },
              entry.anulSiSeria,
              entry.materie,
              entry.ora,
              entry.sala
            ]);
          } else {
            tableRows.push([
              "", // Leave this column empty for subsequent entries of the same day
              entry.anulSiSeria,
              entry.materie,
              entry.ora,
              entry.sala
            ]);
          }
          lastDay = day; // Update lastDay to the current day
        });
      });
  
      // Add the table to the PDF
      doc.autoTable({
        startY: 30,
        head: [tableColumns],
        body: tableRows,
        styles: { cellPadding: 3, fontSize: 10 },
        headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255] },
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
            options={profesorOptions}
            value={profesor}
            onChange={handleProfesorChange}
            getOptionLabel={(option) => option}
            renderInput={(params) => <TextField {...params} label="Profesor" />}
          />
        </Grid>
        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
          {profesor !== null  && (
            <Button variant="contained" onClick={handleSubmit}>
              Submit
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrarDeProfesor;
