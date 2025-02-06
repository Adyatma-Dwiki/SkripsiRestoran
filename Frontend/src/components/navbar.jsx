import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/solid';

function Navbar() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isCheckoutPage = location.pathname === "/Checkout";

  const handleLinkClick = (targetId) => {
    if (isCheckoutPage) {
      navigate("/");
      setTimeout(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    } else {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full p-5 z-50 transition-all duration-300 ${
        isAtTop ? 'bg-transparent text-white' : 'bg-black text-white shadow-lg'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold">Rumah Tamah</div>

        {/* Hamburger Menu */}
        <button
          className="lg:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-icons">menu</span>
        </button>

        {/* Menu Navigasi */}
        <ul
          className={`lg:flex lg:space-x-6 lg:items-center text-lg ${
            isMenuOpen ? 'block' : 'hidden'
          } lg:block absolute lg:relative top-16 lg:top-0 left-0 w-full lg:w-auto bg-black lg:bg-transparent`}
        >
          <li>
            <Link
              to="/"
              className="block p-2 hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("Home")}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/"
              className="block p-2 hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("MakananMenu")}
            >
              Menu Makanan
            </Link>
          </li>
          <li>
            <Link
              to="/"
              className="block p-2 hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("MinumanMenu")}
            >
              Menu Minuman
            </Link>
          </li>
          <li>
            <Link
              to="/"
              className="block p-2 hover:text-yellow-500 text-white"
              onClick={() => handleLinkClick("SnacksMenu")}
            >
              Menu Snacks
            </Link>
          </li>
          <li>
            <Link to="/Checkout" className="block p-2 hover:text-yellow-500 text-white">
              <ShoppingCartIcon className="w-6 h-6 text-white hover:text-yellow-500" />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
