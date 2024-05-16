import { useFetcher } from "react-router-dom";
import Button from "@mui/material/Button";

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
  return (
    <header className=" flex items-center justify-end w-full h-24 bg-gray-200 px-8">
      <LogoutButton />
    </header>
  );
}
