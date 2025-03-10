import { useState } from "react";
import { Link } from "react-router-dom";

const DapurMenuBar = () => {
  const [isaddMenuOpen, setaddMenuOpen] = useState(false);
  const [isdeleteMenuOpen, setdeleteMenuOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);



  return (
    <aside id="default-sidebar" className="fixed top-0 left-0 z-40 w-64 h-screen bg-gray-50 dark:bg-gray-200">
      <div className="overflow-y-auto py-5 px-3 h-full bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <ul className="space-y-2">
          <li>
            <a href="/dapur" className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
              <svg aria-hidden="true" className="w-6 h-6 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>
              <span className="ml-3 hover:text-white">Rumah Tamah</span>
            </a>
          </li>
          <li>
            <button
              type="button"
              className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 bg-gray-800 hover:text-white"
              onClick={() => setaddMenuOpen(!isaddMenuOpen)}
            >
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
              </svg>
              <span className="flex-1 ml-3 text-left whitespace-nowrap">Tambah Menu</span>
              <svg aria-hidden="true" className="w-6 h-6 transition-transform transform" style={{ rotate: isaddMenuOpen ? "180deg" : "0deg" }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
            <ul className={`${isaddMenuOpen ? "block" : "hidden"} py-2 space-y-2`}>
              <li>
                <Link to="/dapur/addMenuMakanan" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Makanan
                </Link>
              </li>
              <li>
              <Link to="/dapur/addMenuMinuman" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Minuman
                </Link>
              </li>
              <li>
              <Link to="/dapur/addMenuSnack" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Snack
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <button
              type="button"
              className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 bg-gray-800  "
              onClick={() => setdeleteMenuOpen(!isdeleteMenuOpen)}
            >
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
              </svg>
              <span className="flex-1 ml-3 text-left whitespace-nowrap">Hapus Menu</span>
              <svg aria-hidden="true" className="w-6 h-6 transition-transform transform" style={{ rotate: isdeleteMenuOpen ? "180deg" : "0deg" }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
            <ul className={`${isdeleteMenuOpen ? "block" : "hidden"} py-2 space-y-2`}>
            <li>
                <Link to="/dapur/deleteMenuMakanan" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Makanan
                </Link>
              </li>
              <Link to="/dapur/deleteMenuMinuman" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Minuman
                </Link>
                <Link to="/dapur/deleteMenuSnack" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Snack
                </Link>
            </ul>
          </li>
          <li>
            <button
              type="button"
              className="flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 bg-gray-800"
              onClick={() => setEditOpen(!isEditOpen)}
            >
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
              </svg>
              <span className="flex-1 ml-3 text-left whitespace-nowrap">Edit Menu</span>
              <svg aria-hidden="true" className="w-6 h-6 transition-transform transform" style={{ rotate: isEditOpen ? "180deg" : "0deg" }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
            <ul className={`${isEditOpen ? "block" : "hidden"} py-2 space-y-2`}>
            <li>
                <Link to="/dapur/editMenuMakanan" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Makanan
                </Link>
              </li>
              <li>
              <Link to="/dapur/editMenuMinuman" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Minuman
                </Link>
              </li>
              <li>
              <Link to="/dapur/editMenuSnack" className="flex items-center p-2 pl-11 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-100 hover:text-white dark:text-white dark:hover:bg-gray-700">
                  Menu Snack
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default DapurMenuBar;
