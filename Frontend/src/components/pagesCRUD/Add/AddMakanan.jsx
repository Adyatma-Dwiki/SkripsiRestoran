import { useState } from "react";
import AddMenuTable from "../../tableCRUD/table";

const AddMenuMakanan = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [message, setMessage] = useState("");

  const handleAddMenu = async (formData) => {
    try {
      const response = await fetch(`${apiUrl}/addMenuMakanan`, {
        method: "POST",
        body: formData, // Kirim FormData langsung
      });

      if (!response.ok) throw new Error("Gagal menambahkan menu");

      const addedMenu = await response.json();
      setMessage("Menu berhasil ditambahkan!");

      console.log("Menu berhasil ditambahkan:", addedMenu);
    } catch (error) {
      setMessage("Terjadi kesalahan saat menambahkan menu.");
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, padding: "20px" }}>
        <h2 className="text-xl font-semibold mb-4">Tambah Menu Makanan</h2>
        
        {message && (
          <div className={`p-2 mb-4 rounded ${message.includes("berhasil") ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {message}
          </div>
        )}

        <AddMenuTable onSubmit={handleAddMenu} />
      </div>
    </div>
  );
};

export default AddMenuMakanan;
