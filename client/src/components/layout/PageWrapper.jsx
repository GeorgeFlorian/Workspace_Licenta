import { Outlet } from "react-router-dom";
import Footer from "@components/ui/Footer.jsx";
import Header from "@components/ui/Header.jsx";

export default function PageWrapper() {
  return (
    <div className="min-h-screen h-full w-full flex flex-col justify-between">
      <Header />
      <div className="bg-white h-full flex flex-col justify-center gap-4 mx-auto my-auto max-w-screen-2xl">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
