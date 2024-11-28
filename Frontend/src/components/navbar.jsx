import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-dark-900 text-white p-5 fixed w-full top-0 left-0 z-50">
      <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
        {/* Logo / Branding */}
        <NavLink 
          to="/" 
          className="text-white text-4xl font-semibold hover:text-gray-300">
          Ramah Tamah
        </NavLink>

        {/* Navbar Links */}
        <div className="hidden md:flex space-x-8 text-2xl">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "text-gray-300" : "text-white hover:text-gray-300"}>
            Home
          </NavLink>
          <NavLink 
            to="/Makanan" 
            className={({ isActive }) => isActive ? "text-gray-300" : "text-white hover:text-gray-300"}>
            Makanan
          </NavLink>
          <NavLink 
            to="/Minuman" 
            className={({ isActive }) => isActive ? "text-gray-300" : "text-white hover:text-gray-300"}>
            Minuman
          </NavLink>
          <NavLink 
            to="/Snacks" 
            className={({ isActive }) => isActive ? "text-gray-300" : "text-white hover:text-gray-300"}>
            Snacks
          </NavLink>
          <NavLink 
            to="/Checkout" 
            className={({ isActive }) => isActive ? "text-gray-300" : "text-white hover:text-gray-300"}>
            Checkout
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" aria-label="Open menu">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
