import EditMenu from "../../tableCRUD/editMenu";

const EditMinuman = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
        const fetchGetMinuman = () => {
            return fetch(`${apiUrl}/menuMinuman`)
                .then(res => res.json())
                .then(data => data.data || []);
        };
    
        return <EditMenu fetchDataFunction={fetchGetMinuman} editApiUrl={`${apiUrl}/editMenuMinuman`} />;
    
};

export default EditMinuman;