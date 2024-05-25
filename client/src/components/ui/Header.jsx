import { useFetcher, useRouteLoaderData } from "react-router-dom";
import Button from "@mui/material/Button";
import { Typography } from "@mui/material";

const LogoutButton = () => {
  let fetcher = useFetcher();
  let isLoggingOut = fetcher.formData != null;
  return (
    <fetcher.Form method="post" action="/logout">
      <Button
        variant="contained"
        color="primary"
        disabled={isLoggingOut}
        type="submit"
      >
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </Button>
    </fetcher.Form>
  );
};

export default function Header() {
  const { user } = useRouteLoaderData("root");
  return (
    <header className="flex items-center w-full h-24 bg-gray-200">
      <div className="flex items-center justify-between w-full mx-auto max-w-screen-xl px-8">
        <div>
          <Typography variant="h4">Welcome {user}</Typography>
        </div>
        <div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
