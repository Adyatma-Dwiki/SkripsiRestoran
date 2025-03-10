import DeleteMenu from "../../tableCRUD/deleteMenu";

const DeleteMinuman = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchGetMinuman = () => {
        return fetch(`${apiUrl}/menuMinuman`)
            .then(res => res.json())
            .then(data => data.data || []);
    };

    return <DeleteMenu fetchDataFunction={fetchGetMinuman} deleteApiUrl={`${apiUrl}/deleteMenuMinuman`} />;

};

export default DeleteMinuman;
