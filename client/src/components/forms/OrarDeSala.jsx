import { useState } from "react";
import { Autocomplete, TextField, Box, Button, Grid } from "@mui/material";

const salaOptions = ["sala1", "sala2"];
const ziOptions = ["luni", "marti", "miercuri", "joi", "vineri"];

const OrarDeSala = () => {
  const [sala, setSala] = useState(null);
  const [zi, setZi] = useState(null);

  const handleSalaChange = (event, value) => {
    setSala(value);
  };

  const handleZiChange = (event, value) => {
    setZi(value);
  };

  const handleSubmit = async () => {
    const data = {
      sala,
      zi,
    };

    try {
      const response = await fetch("/api/orar-sala", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();
      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Grid container spacing={2} sx={{ width: { xs: "100%", sm: "50%" } }}>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={salaOptions}
            value={sala}
            onChange={handleSalaChange}
            getOptionLabel={(option) => option}
            renderInput={(params) => <TextField {...params} label="Sala" />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={ziOptions}
            value={zi}
            onChange={handleZiChange}
            getOptionLabel={(option) => option}
            renderInput={(params) => <TextField {...params} label="Zi" />}
          />
        </Grid>
        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
          {sala !== null && zi !== null && (
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
