import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar";


function RootLayout() {
  return (
    <div>
      <Navbar />
      <main className="pt-0"> {/* Adjust padding to prevent overlap with fixed Navbar */}
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;
