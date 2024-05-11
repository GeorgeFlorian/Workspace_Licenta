import { Outlet } from "react-router-dom";

export default function PageWrapper() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
