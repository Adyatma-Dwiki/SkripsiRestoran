import DeleteMenu from "../../tableCRUD/deleteMenu";

const DeleteMakanan = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchGetMakanan = () => {
        return fetch(`${apiUrl}/menuMakanan`)
            .then(res => res.json())
            .then(data => data.data || []);
    };

    return <DeleteMenu fetchDataFunction={fetchGetMakanan} deleteApiUrl={`${apiUrl}/deleteMenuMakanan`} />;

};

export default DeleteMakanan;
