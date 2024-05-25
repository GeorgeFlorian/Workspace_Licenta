import { useState } from "react";
import { Autocomplete, TextField, Box, Button, Grid } from "@mui/material";

const anOptions = [1, 2, 3, 4];
const serieOptions = ["A", "B", "C", "D", "E", "F", "G"];
const paritateOptions = ["par", "impar"];
const ziOptions = ["luni", "marti", "miercuri", "joi", "vineri"];

const OrarDeGrupa = () => {
  const [an, setAn] = useState(null);
  const [serie, setSerie] = useState(null);
  const [paritate, setParitate] = useState(null);
  const [zi, setZi] = useState(null);
  const [grupa, setGrupa] = useState(null);
  const [form, setForm] = useState([]);

  const handleAnChange = (event, value) => {
    setAn(value);
    setSerie(null);
    setParitate(null);
    setZi(null);
    setGrupa(null);
    setForm([]);
  };

  const handleSerieChange = (event, value) => {
    setSerie(value);
    setParitate(null);
    setZi(null);
    setGrupa(null);
    setForm([]);
  };

  const handleParitateChange = (event, value) => {
    setParitate(value);
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
    const data = {
      an,
      serie,
      paritate,
      zi,
      grupa,
    };

    try {
      const response = await fetch("/api/orar-grupa", {
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
              options={ziOptions}
              value={zi}
              onChange={handleZiChange}
              getOptionLabel={(option) => option}
              renderInput={(params) => <TextField {...params} label="Zi" />}
            />
          )}
        </Grid>
        <Grid item xs={12}>
          {an !== null &&
            serie !== null &&
            paritate !== null &&
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
