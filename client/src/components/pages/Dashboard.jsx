import { useRouteLoaderData } from "react-router-dom";

export default function Dashboard() {
  let { user } = useRouteLoaderData("root");

  return (
    <div className="mx-auto">
      <p>Welcome {user} !</p>
    </div>
  );
}
