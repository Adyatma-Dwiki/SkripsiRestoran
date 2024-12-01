import { useEffect } from "react";
import LandingPage from "../components/landingpage";
import MenuMakanan from "../components/menuMakanan";
import MenuMinuman from "../components/menuMinuman";
import MenuSnacks from "../components/menuSnack";
// import MenuSnack from "../components/menuSnack";


const Homepage = () => {
  useEffect(() => {
    // Menangani scroll otomatis jika URL berisi fragment
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []); // Menjalankan hanya sekali saat halaman pertama kali dimuat

  return (
    <div>
      <LandingPage />
      <MenuMakanan />
      <MenuMinuman />
      <MenuSnacks />
    </div>
  );
};

export default Homepage;
