import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useLocation dan useNavigate
import { ShoppingCartIcon } from '@heroicons/react/24/solid'; // Icon keranjang belanja

function Navbar() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State untuk menu hamburger
  const location = useLocation(); // Hook untuk mendeteksi path halaman
  const navigate = useNavigate(); // Hook untuk melakukan navigasi programatik

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0); // True jika di posisi teratas
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Cek apakah saat ini berada di halaman Checkout
  const isCheckoutPage = location.pathname === "/Checkout";

  const handleLinkClick = (targetId) => {
    if (isCheckoutPage) {
      // Jika berada di Checkout, navigasikan ke root (/) terlebih dahulu
      navigate("/");

      // Scroll ke elemen tertentu setelah halaman dimuat
      setTimeout(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Waktu delay untuk memastikan halaman sudah dimuat
    } else {
      // Jika sudah di root, langsung scroll ke elemen tanpa perubahan route
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full p-5 z-50 transition-all duration-300 ${isAtTop ? 'bg-transparent text-white' : 'bg-black text-white shadow-lg'
        }`}
    >
      <div className="container mx-auto flex justify-between items-center pt-3">
        <div className="text-3xl font-bold">Rumah Tamah</div>

        {/* Tombol Hamburger untuk tampilan mobile */}
        <button
          className="lg:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-icons">menu</span>
        </button>

        <ul className={`lg:flex space-x-6 text-xl ${isMenuOpen ? 'block' : 'hidden'}`}>
          {/* Home link */}
          <li>
            <Link
              to="/"
              className="hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("Home")} // Panggil handleLinkClick saat klik
            >
              Home
            </Link>
          </li>

          {/* Menu Makanan link */}
          <li>
            <Link
              to="/"
              className="hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("MakananMenu")}
            >
              Menu Makanan
            </Link>
          </li>

          {/* Menu Minuman link */}
          <li>
            <Link
              to="/"
              className="hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("MinumanMenu")} // Panggil handleLinkClick saat klik
            >
              Menu Minuman
            </Link>
          </li>

          {/* Menu Snacks link */}
          <li>
            <Link
              to="/"
              className="hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("SnacksMenu")} // Panggil handleLinkClick saat klik
            >
              Menu Snacks
            </Link>
          </li>

          {/* Checkout link */}
          <li>
            <Link to="/Checkout" className="hover:text-yellow-500 text-white">
              <ShoppingCartIcon className="w-6 h-6 text-white hover:text-yellow-500 cursor-pointer" />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
