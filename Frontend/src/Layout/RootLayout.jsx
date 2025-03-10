import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/navbar";
import DapurMenuBar from "../components/dapurMenu"; // Import side menu

function RootLayout() {
  const location = useLocation();
  const isDapurPage = location.pathname.startsWith("/dapur"); // Cek jika halaman di /dapur

  return (
    <div className="flex h-screen w-screen">
      {/* Navbar hanya muncul jika bukan di halaman dapur */}
      {!isDapurPage && <Navbar />}

      {/* Wrapper untuk halaman dapur dengan sidebar */}
      {isDapurPage ? (
        <div className="flex h-full w-full">
          {/* Sidebar hanya muncul di halaman dapur */}
          <div className="w-64 bg-gray-100 dark:bg-gray-800 p-4 flex-shrink-0">
            <DapurMenuBar />
          </div>

          {/* Bagian utama */}
          <div className="flex-1 overflow-auto p-5">
            <Outlet />
          </div>
        </div>
      ) : (
        // Jika bukan halaman dapur, tampilkan Outlet secara normal
        <main className="pt-0 w-full">
          <Outlet />
        </main>
      )}
    </div>
  );
}

export default RootLayout;
