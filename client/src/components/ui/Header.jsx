import { useFetcher } from "react-router-dom";

const LogoutButton = () => {
  let fetcher = useFetcher();
  let isLoggingOut = fetcher.formData != null;
  return (
    <fetcher.Form method="post" action="/logout">
      <button type="submit" disabled={isLoggingOut}>
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </button>
    </fetcher.Form>
  );
};

export default function Header() {
  return (
    <header className=" flex items-center justify-end w-full h-24 bg-gray-400 px-8">
      <LogoutButton />
    </header>
  );
}
