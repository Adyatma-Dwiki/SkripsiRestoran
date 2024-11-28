import  { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
// Import Firestore instance

const MenuSnack = () => {
    const [menu, setMenu] = useState([]);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const docRef = doc(db, 'Menu', 'SnackMenu'); // Reference to 'SnackMenu'
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setMenu(data.Snack || []); // Access the 'Snack' array
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.log('Error fetching menu:', error);
            }
        };

        fetchMenu();
    }, []); // Runs only once when the component mounts

    return (
        <div>
            <h1>Snack Menu</h1>
            {menu.length === 0 ? (
                <p>Loading menu...</p>
            ) : (
                <ul>
                    {menu.map((item, index) => (
                        <li key={index}>
                            <strong>{item.Nama}</strong> - Rp{item.Harga}
                            <br />
                            <em>{item.Deskripsi}</em>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MenuSnack;