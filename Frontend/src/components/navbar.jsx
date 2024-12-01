import { Link } from "react-scroll";

function Navbar() {
  return (
    <nav className="sticky top-0 bg-black text-white p-9 z-50 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-lg font-bold">Restoran Resto</div>
        <ul className="flex space-x-6">
          <li><Link to="Home" smooth={true} className="hover:text-yellow-500">Home</Link></li>
          <li><Link to="MakananMenu" smooth={true} className="hover:text-yellow-500">Menu Makanan</Link></li>
          <li><Link to="MinumanMenu" smooth={true} className="hover:text-yellow-500">Menu Minuman</Link></li>
          <li><Link to="SnacksMenu" smooth={true} className="hover:text-yellow-500">Menu Snacks</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
