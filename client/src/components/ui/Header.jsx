import { useFetcher } from "react-router-dom";

const LogoutButton = () => {
  let fetcher = useFetcher();
  let isLoggingOut = fetcher.formData != null;
  return (
    <fetcher.Form method="post" action="/logout">
      <button
        type="submit"
        disabled={isLoggingOut}
        className="flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-blue-200 hover:text-blue-800 rounded-md px-4 py-2 drop-shadow-lg"
      >
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </button>
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
