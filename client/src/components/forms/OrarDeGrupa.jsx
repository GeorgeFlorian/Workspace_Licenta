import { useState } from "react";
import { Autocomplete, TextField, Box, Button, Grid } from "@mui/material";

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
  
      // Create a Blob from the data
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  
      // Create a link element
      const link = document.createElement('a');
  
      // Set the download attribute with a filename
      link.download = 'orar-de-grupa.json';
  
      // Create a URL for the Blob and set it as the href attribute
      link.href = URL.createObjectURL(blob);
  
      // Append the link to the body
      document.body.appendChild(link);
  
      // Programmatically click the link to trigger the download
      link.click();
  
      // Remove the link from the document
      document.body.removeChild(link);
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
