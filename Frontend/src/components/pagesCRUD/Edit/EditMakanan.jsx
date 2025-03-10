import EditMenu from "../../tableCRUD/editMenu";

const EditMakanan = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
        const fetchGetMakanan = () => {
            return fetch(`${apiUrl}/menuMakanan`)
                .then(res => res.json())
                .then(data => data.data || []);
        };
    
        return <EditMenu fetchDataFunction={fetchGetMakanan} editApiUrl={`${apiUrl}/editMenuMakanan`} />;
    
};

export default EditMakanan;