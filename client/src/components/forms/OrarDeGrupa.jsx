import { useState } from "react";
import { Autocomplete, TextField, Box, Button, Grid } from "@mui/material";
import { jsPDF } from "jspdf";
import "jspdf-autotable";


const anOptions = [1, 2, 3, 4];
const serieOptions = ["A", "B", "C", "D", "E", "F", "G"];
const paritateOptions = ["par", "impar"];
const ziOptions = ["luni", "marti", "miercuri", "joi", "vineri"];
const semigrupaOptions = ['a', 'b'];


const OrarDeGrupa = () => {
  const [an, setAn] = useState(null);
  const [serie, setSerie] = useState(null);
  const [paritate, setParitate] = useState(null);
  const [zi, setZi] = useState(null);
  const [semigrupa, setSemigrupa] = useState(null);
  const [grupa, setGrupa] = useState(null);
  const [form, setForm] = useState([]);
  

  const handleAnChange = (event, value) => {
    setAn(value);
    setSerie(null);
    setParitate(null);
    setSemigrupa(null);
    setZi(null);
    setGrupa(null);
    setForm([]);
  };

  const handleSerieChange = (event, value) => {
    setSerie(value);
    setParitate(null);
    setSemigrupa(null);
    setZi(null);
    setGrupa(null);
    setForm([]);
  };

  const handleParitateChange = (event, value) => {
    setParitate(value);
    setSemigrupa(null);
    setZi(null);
    setGrupa(null);
    setForm([]);
  };
  const handleSemigrupaChange = (event, value) => {
    setSemigrupa(value);
    setZi(null);
    setGrupa(null);
    setForm([]);
  };
  const handleZiChange = (event, value) => {
    setZi(value);
    setGrupa(null);
    setForm([]);
    if (an !== null && serie !== null && paritate !== null) {
      generateForm(an, serie);
    }
  };

  const generateForm = (an, serie) => {
    const options = Array.from(
      { length: 5 },
      (_, index) => `4${an}${index + 1}${serie}`,
    );
    setForm(options);
  };

  const handleGrupaChange = (event, value) => {
    setGrupa(value);
  };

  const handleSubmit = async () => {
    const params = new URLSearchParams({
      an,
      serie,
      paritate,
      semigrupa,
      zi,
      grupa,
    }).toString();
  
    try {
      const response = await fetch(`/api/orar-grupa?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      console.log('Success:', result);
      const doc = new jsPDF();
      // Load the font
      doc.addFont("Roboto-Black.ttf", "Roboto-Black", "normal");

      // Set the font for text
      doc.setFont('Roboto-Black');

      // Create a new jsPDF instance
      // Title styling
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text(result.numeOrar, 10, 10);

      // Subtitle styling
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Zi: ${result.zi}`, 10, 20);
      doc.text(`Saptamana: ${result.saptamana}`, 10, 30);
      doc.text(`Grupa: ${result.grupa}`, 10, 40);

      // Draw a line below the header
      doc.setLineWidth(0.5);
      doc.line(10, 45, 200, 45);

      // Prepare the data for the table
      const tableColumn = ["Ora", "Materie", "Profesor", "Sala"];
      const tableRows = result.orar.map(item => [
        item.ora,
        item.materie || '',
        item.profesor || '',
        item.sala || '',
      ]);

      // Add the table to the PDF
      doc.autoTable({
        startY: 50,
        head: [tableColumn],
        body: tableRows,
      });

      // Save the PDF
      doc.output('dataurlnewwindow');
      
    } catch (error) {
      console.error('Error:', error);
    }
  };
  


  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Grid container spacing={2} sx={{ width: { sm: "75%", md: "50%" } }}>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={anOptions}
            value={an}
            onChange={handleAnChange}
            getOptionLabel={(option) => option.toString()}
            renderInput={(params) => <TextField {...params} label="An" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          {an !== null && (
            <Autocomplete
              options={serieOptions}
              value={serie}
              onChange={handleSerieChange}
              getOptionLabel={(option) => option}
              renderInput={(params) => <TextField {...params} label="Serie" />}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          {an !== null && serie !== null && (
            <Autocomplete
              options={paritateOptions}
              value={paritate}
              onChange={handleParitateChange}
              getOptionLabel={(option) => option}
              renderInput={(params) => (
                <TextField {...params} label="Paritate" />
              )}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          {an !== null && serie !== null && paritate !== null && (
            <Autocomplete
              options={semigrupaOptions}
              value={semigrupa}
              onChange={handleSemigrupaChange}
              getOptionLabel={(option) => option}
              renderInput={(params) => (
                <TextField {...params} label="Semigrupa" />
              )}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          {an !== null && serie !== null && paritate !== null && semigrupa !== null && (
            <Autocomplete
              options={ziOptions}
              value={zi}
              onChange={handleZiChange}
              getOptionLabel={(option) => option}
              renderInput={(params) => <TextField {...params} label="Zi" />}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          {an !== null &&
            serie !== null &&
            paritate !== null &&
            semigrupa !== null &&
            zi !== null && (
              <Autocomplete
                options={form}
                value={grupa}
                onChange={handleGrupaChange}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                  <TextField {...params} label="Grupa" />
                )}
              />
            )}
        </Grid>
        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
          {an !== null &&
            serie !== null &&
            paritate !== null &&
            semigrupa !== null &&
            zi !== null &&
            grupa !== null && (
              <Button variant="contained" onClick={handleSubmit}>
                Submit
              </Button>
            )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrarDeGrupa;
