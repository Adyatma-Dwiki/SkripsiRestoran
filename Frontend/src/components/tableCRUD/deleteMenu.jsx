import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import PropTypes from 'prop-types';

const DeleteMenu = ({ fetchDataFunction, deleteApiUrl }) => {
    const [menus, setMenus] = useState([]);

    useEffect(() => {
        fetchDataFunction().then(setMenus).catch(error => console.error("Error fetching data:", error));
    }, [fetchDataFunction]);

    const handleDelete = (id) => {
        const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus menu ini?");
        if (!confirmDelete) return;
    
        const url = `${deleteApiUrl}/${id}`;
        console.log("Delete Request URL:", url);  // 🔍 Debugging URL
    
        fetch(url, { 
            method: "DELETE",
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Gagal menghapus data");
            }
            return res.json();
        })
        .then(() => {
            setMenus((prevData) => prevData.filter(item => item.id !== id));
        })
        .catch((error) => console.error("Error deleting menu:", error));
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
                                            onClick={() => handleDelete(menu.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 size={20} />
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
            </div>
    );
};
DeleteMenu.propTypes = {
    fetchDataFunction: PropTypes.func.isRequired,
    deleteApiUrl: PropTypes.string.isRequired,
};

export default DeleteMenu;

