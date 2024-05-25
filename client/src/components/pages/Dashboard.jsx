import { useState } from "react";
import { Button, Typography } from "@mui/material";
import OrarDeGrupa from "@components/forms/OrarDeGrupa.jsx";
import OrarDeSala from "@components/forms/OrarDeSala.jsx";

const Dashboard = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <div className="flex flex-col gap-8">
      {/* Titlu */}
      <Typography variant="h4" className="mb-4">
        Genereaza Orar
      </Typography>
      {/* Butoane pentru alegerea orarului */}
      <div className="flex flex-wrap items-center gap-4 self-center">
        <Typography variant="h6">Alege tipul orarului:</Typography>
        <div className="flex gap-4">
          <Button
            variant="contained"
            onClick={() => setSelectedOption("grupa")}
            color={selectedOption === "grupa" ? "secondary" : "primary"}
          >
            Orar de grupa
          </Button>
          <Button
            variant="contained"
            onClick={() => setSelectedOption("sala")}
            color={selectedOption === "sala" ? "secondary" : "primary"}
          >
            Orar de sala
          </Button>
        </div>
      </div>
      {/* Conditional rendering based on selected option */}
      {selectedOption === "grupa" && <OrarDeGrupa />}
      {selectedOption === "sala" && <OrarDeSala />}
    </div>
  );
};

export default Dashboard;
