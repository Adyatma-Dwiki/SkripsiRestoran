import { useState, useEffect } from "react";

const MenuMakanan = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Pastikan URL yang digunakan sesuai
    fetch("http://localhost:8080/menuMakanan")
      .then((response) => response.json())
      .then((result) => {
        console.log(result);  // Periksa apakah hasilnya sesuai dengan yang diinginkan
        setData(result.data); // Menyimpan data ke state
      })
      .catch((error) => console.error("Error:", error));

  }, []);

  return (
    <>
      <div className="container mx-auto p-4" id="MakananMenu">
        <h1 className="text-3xl font-bold text-center mb-6">Menu Makanan</h1>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <li key={item.id} className="border rounded-lg shadow-md p-4 bg-white">
              <h2 className="text-xl font-semibold mb-2 text-black">{item.Nama}</h2>
              <p className="text-gray-700 mb-4">{item.Deskripsi}</p>
              <p className="text-lg font-bold text-green-600 mb-4">
              Harga: Rp {new Intl.NumberFormat('id-ID').format(item.Harga)}
              </p>
              <img
                src={`http://localhost:8080/${item.image}`}
                alt={item.Nama}
                className="w-full h-auto rounded-md"
              />
            </li>
          ))}
        </ul>
      </div>

    </>
  );
};

export default MenuMakanan;
