import Button from "@mui/material/Button";
import { Typography } from "@mui/material";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext.jsx";
import { useLogout } from "@/hooks/useLogout.js";

const LogoutButton = ({ user }) => {
  const { logout } = useLogout();
  return (
    <Button variant="contained" color="primary" type="submit" onClick={logout}>
      Sign out
    </Button>
  );
};

export default function Header() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return null;
  }

  return (
    <header className="flex items-center w-full h-24 bg-gray-200">
      <div className="flex items-center justify-between w-full mx-auto max-w-screen-xl px-8">
        <div>
          <Typography variant="h4">Welcome {user.username}</Typography>
        </div>
        <div>
          <LogoutButton user={user} />
        </div>
      </div>
    </header>
  );
}
