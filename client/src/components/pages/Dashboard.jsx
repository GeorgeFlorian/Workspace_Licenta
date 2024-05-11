import { useFetcher, useRouteLoaderData } from "react-router-dom";

export default function Dashboard() {
  let { user } = useRouteLoaderData("root");
  let fetcher = useFetcher();
  let isLoggingOut = fetcher.formData != null;

  return (
    <div>
      <p>Welcome {user}!</p>
      <fetcher.Form method="post" action="/logout">
        <button type="submit" disabled={isLoggingOut}>
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
      </fetcher.Form>
    </div>
  );
}
