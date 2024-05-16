import { Outlet } from "react-router-dom";
import Footer from "@components/ui/Footer.jsx";
import Header from "@components/ui/Header.jsx";

export default function PageWrapper() {
  return (
    <div className="min-h-screen h-full w-full flex flex-col justify-between">
      <Header />
      <div className="flex-1 bg-white h-full w-full mx-auto max-w-screen-xl py-8">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
