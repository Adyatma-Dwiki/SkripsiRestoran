import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import PropTypes from 'prop-types';

const EditMenu = ({ fetchDataFunction, editApiUrl }) => {
    const [menus, setMenus] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchDataFunction().then(setMenus).catch(error => console.error("Error fetching data:", error));
    }, [fetchDataFunction]);

    const handleEdit = (menu) => {
        setSelectedMenu(menu);
        setImagePreview(menu.images); 
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        setSelectedMenu({ ...selectedMenu, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        const formData = new FormData();
        formData.append("Nama", selectedMenu.Nama);
        formData.append("Deskripsi", selectedMenu.Deskripsi);
        formData.append("Harga", selectedMenu.Harga);
        if (imageFile) {
            formData.append("images", imageFile);
        }

        fetch(`${editApiUrl}/${selectedMenu.id}`, {
            method: "PUT",
            body: formData,
        })
        .then((res) => res.json())
        .then(() => {
            setMenus(menus.map((item) => (item.id === selectedMenu.id ? selectedMenu : item)));
            setIsModalOpen(false);
            setSelectedMenu(null);
            setImageFile(null);
            setImagePreview(null);
        })
        .catch((error) => console.error("Error updating menu:", error));
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
                <thead>
                    <tr className="bg-gray-100 border-b text-black">
                        <th className="py-2 px-4 text-center">ID</th>
                        <th className="py-2 px-4 text-center">Nama</th>
                        <th className="py-2 px-4 text-center">Deskripsi</th>
                        <th className="py-2 px-4 text-center">Harga</th>
                        <th className="py-2 px-4 text-center">Gambar</th>
                        <th className="py-2 px-4 text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {menus.length > 0 ? (
                        menus.map((menu) => (
                            <tr key={menu.id} className="border-b hover:bg-gray-50 text-black">
                                <td className="py-2 px-4 text-center">{menu.id}</td>
                                <td className="py-2 px-4 text-center font-semibold">{menu.Nama}</td>
                                <td className="py-2 px-4 text-center">{menu.Deskripsi}</td>
                                <td className="py-2 px-4 text-center text-green-600 font-bold">
                                    {menu.Harga.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}
                                </td>
                                <td className="py-2 px-4 text-center">
                                    <img src={menu.images} alt={menu.Nama} className="w-16 h-16 rounded-md mx-auto" />
                                </td>
                                <td className="py-2 px-4 text-center">
                                    <button 
                                        onClick={() => handleEdit(menu)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Pencil size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center py-4 text-gray-500">Tidak ada menu tersedia</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* 🔥 Modal Pop-up untuk Edit */}
            {isModalOpen && selectedMenu && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                        <h2 className="text-xl font-bold mb-4 text-black">Edit Menu</h2>
                        <label className="block mb-2 text-black">
                            Nama:
                            <input 
                                type="text" 
                                name="Nama" 
                                value={selectedMenu.Nama} 
                                onChange={handleChange} 
                                className="border p-2 w-full rounded text-white"
                            />
                        </label>
                        <label className="block mb-2 text-black">
                            Deskripsi:
                            <input 
                                type="text" 
                                name="Deskripsi" 
                                value={selectedMenu.Deskripsi} 
                                onChange={handleChange} 
                                className="border p-2 w-full rounded text-white"
                            />
                        </label>
                        <label className="block mb-2 text-black">
                            Harga:
                            <input 
                                type="number" 
                                name="Harga" 
                                value={selectedMenu.Harga} 
                                onChange={handleChange} 
                                className="border p-2 w-full rounded text-white"
                            />
                        </label>
                        <label className="block mb-2 text-black">
                            Gambar:
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageChange}
                                className="border p-2 w-full rounded text-white"
                            />
                        </label>
                        {imagePreview && (
                            <img src={imagePreview} alt="Preview" className="w-32 h-32 mx-auto rounded-lg mb-2" />
                        )}
                        <div className="flex justify-end mt-4">
                            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button>
                            <button onClick={() => setIsModalOpen(false)} className="ml-2 bg-gray-400 text-white px-4 py-2 rounded">Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

EditMenu.propTypes = {
    fetchDataFunction: PropTypes.func.isRequired,
    editApiUrl: PropTypes.string.isRequired,
};

export default EditMenu;
