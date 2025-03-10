import EditMenu from "../../tableCRUD/editMenu";

const EditSnack = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
        const fetchGetSnack = () => {
            return fetch(`${apiUrl}/menuSnacks`)
                .then(res => res.json())
                .then(data => data.data || []);
        };
    
        return <EditMenu fetchDataFunction={fetchGetSnack} editApiUrl={`${apiUrl}/editMenuSnack`} />;
    
};

export default EditSnack;