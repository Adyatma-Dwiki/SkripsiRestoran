import { useState } from "react";
import PropTypes from "prop-types";

const AddMenuTable = ({ onSubmit }) => {
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [gambar, setGambar] = useState(null);
  const [harga, setHarga] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGambar(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!gambar) {
      setErrorMessage("Silakan pilih gambar sebelum menambahkan menu.");
      return;
    }

    const formData = new FormData();
    formData.append("Nama", nama);  // Sesuaikan nama field
    formData.append("Deskripsi", deskripsi);
    formData.append("Harga", Number(harga)); // Konversi harga ke angka
    formData.append("file", gambar); // Sesuaikan dengan backend

    try {
      await onSubmit(formData);
      setNama("");
      setDeskripsi("");
      setHarga("");
      setGambar(null);
      setErrorMessage("");
      
      // Reset input file agar tidak menampilkan nama file lama
      document.getElementById("fileInput").value = "";
      
    } catch (error) {
      console.log("Error:", error);
      setErrorMessage("Terjadi kesalahan saat menambahkan menu.");
    }
  };

  return (
    <div className="container mx-auto px-4 mt-5">
      {errorMessage && (
        <div className="bg-red-500 text-white p-2 rounded-md mb-4">{errorMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-4 shadow-md rounded-lg mb-4">
        <div className="flex flex-col gap-3">
          <label className="text-gray-700 font-medium">Nama Menu</label>
          <input type="text" placeholder="Masukkan Nama Menu" value={nama} onChange={(e) => setNama(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />

          <label className="text-gray-700 font-medium">Deskripsi</label>
          <input type="text" placeholder="Masukkan Deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />

          <label className="text-gray-700 font-medium">Harga</label>
          <input type="number" placeholder="Masukkan Harga" value={harga} onChange={(e) => setHarga(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />

          <label className="text-gray-700 font-medium">Gambar Menu</label>
          <label className="w-full px-3 py-2 border rounded-md flex items-center bg-white text-gray-500 cursor-pointer">
            <span className="flex-1">{gambar ? gambar.name : "Pilih File Gambar"}</span>
            <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <button type="submit" className="mt-4 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Tambah Menu
        </button>
      </form>
    </div>
  );
};

AddMenuTable.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default AddMenuTable;
