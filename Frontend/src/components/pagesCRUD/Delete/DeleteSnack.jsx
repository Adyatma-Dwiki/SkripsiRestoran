import DeleteMenu from "../../tableCRUD/deleteMenu";

const DeleteSnack = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchGetSnack = () => {
        return fetch(`${apiUrl}/menuSnacks`)
            .then(res => res.json())
            .then(data => data.data || []);
    };

    return <DeleteMenu fetchDataFunction={fetchGetSnack} deleteApiUrl={`${apiUrl}/deleteMenuSnack`} />;

};

export default DeleteSnack;
