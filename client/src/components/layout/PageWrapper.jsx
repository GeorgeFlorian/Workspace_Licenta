import { Outlet } from "react-router-dom";

export default function PageWrapper() {
  return (
    <div className="bg-white">
      <Outlet />
    </div>
  );
}
