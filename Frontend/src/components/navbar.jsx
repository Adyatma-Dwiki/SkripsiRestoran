import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Untuk routing antar halaman
import { Link as ScrollLink } from 'react-scroll'; // Untuk scroll dalam halaman yang sama
import { ShoppingCartIcon } from '@heroicons/react/24/solid'; // Icon keranjang belanja


function Navbar() {
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY === 0); // True jika di posisi teratas
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full p-5 z-50 transition-all duration-300 ${
        isAtTop ? 'bg-transparent text-white' : 'bg-black text-white shadow-lg'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center pt-3">
        <div className="text-3xl font-bold">Rumah Tamah</div>
        <ul className="flex space-x-6 text-xl">
          {/* Gunakan react-scroll untuk scroll ke bagian halaman */}
          <li>
            <ScrollLink to="Home" smooth={true} className="hover:text-yellow-500 text-white">
              Home
            </ScrollLink>
          </li>
          <li>
            <ScrollLink to="MakananMenu" smooth={true} className="hover:text-yellow-500 text-white">
              Menu Makanan
            </ScrollLink>
          </li>
          <li>
            <ScrollLink to="MinumanMenu" smooth={true} className="hover:text-yellow-500 text-white">
              Menu Minuman
            </ScrollLink>
          </li>
          <li>
            <ScrollLink to="SnacksMenu" smooth={true} className="hover:text-yellow-500 text-white">
              Menu Snacks
            </ScrollLink>
          </li>
          {/* Gunakan react-router-dom untuk berpindah halaman */}
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
