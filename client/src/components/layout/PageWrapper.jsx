import { Outlet } from "react-router-dom";

export default function PageWrapper() {
  return (
    <div className="PageWrapper bg-white h-full max-w-screen-2xl flex flex-col justify-center gap-4 mx-auto my-auto">
      <Outlet />
    </div>
  );
}
