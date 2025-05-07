import { useEffect, useState, useRef } from "react";

const DapurList = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL;
    const wsRef = useRef(null);

    // command fetch data order dari database dapur 
    const fetchOrders = () => {
        fetch(`${apiUrl}/dapur`)
            .then((response) => response.json())
            .then((result) => {
                console.log("Fetched Result:", result);
                setOrders(Array.isArray(result.data) ? result.data : result.data || []);
            })
            .catch((error) => console.error("Error fetching orders:", error));
    };

    //setup websocket ke backend
    const setupWebSocket = () => {
        const wsUrl = `${apiUrl.replace(/^http/, "ws")}/dapur/ws`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;
    
        socket.onopen = () => {
            console.log("WebSocket connected to /dapur");
        };
    
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("WebSocket data received:", data);
        
            const updates = Array.isArray(data) ? data : [data]; // data di olah sebagai array
        
            setOrders((prevOrders) => {
                let newOrders = [...prevOrders];
        
                updates.forEach((update) => {
                    const index = newOrders.findIndex((order) => order.id === update.id);
        
                    if (index !== -1) {
                        // Update pesanan yang sudah ada, sesuaikan status dan gabungkan data
                        const existingOrder = newOrders[index];
                        const updatedOrder = {
                            ...existingOrder,
                            ...update,
                            status: update.status || existingOrder.status,
                        };
        
                        newOrders[index] = updatedOrder;
                    } else {
                        // Pesanan baru, tambahkan dengan status default jika belum ada
                        const newOrder = {
                            ...update,
                            status: "Belum Dibuat", // Status default untuk pesanan baru
                        };
        
                        newOrders.push(newOrder);
                    }
                });
        
                // Urutkan berdasarkan status dan ID untuk mengikuti urutan FIFO
                newOrders.sort((a, b) => {
                    const statusOrder = {
                        "Belum Dibuat": 1,
                        "Siap Antar": 2,
                        "Pegawai selesai mengantar": 3,
                    };
        
                    const statusA = statusOrder[a.status] || 4;
                    const statusB = statusOrder[b.status] || 4;
        
                    // Urutkan berdasarkan status terlebih dahulu
                    if (statusA !== statusB) {
                        return statusA - statusB;
                    }
        
                    // Jika status sama, urutkan berdasarkan ID (Ascending untuk FIFO)
                    return a.id - b.id;
                });
        
                return newOrders;
            });
        };
        
    
        socket.onerror = (err) => {
            console.error("WebSocket error", err);
        };
    
        socket.onclose = () => {
            console.log("WebSocket disconnected, attempting to reconnect...");
            setTimeout(setupWebSocket, 1000);
        };
    };
          
    // render pertama kali
    useEffect(() => {
        fetchOrders();
        setupWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // fungsi untuk ngehandle orderan yang diselesaikan
    const handleCheckOrder = (order) => {
        setSelectedOrder(order);
    };

    // fungsi buat menyelesaikan orderan dipakai untuk di tombol konfirmasi
    const confirmOrder = () => {
        if (!selectedOrder) return;
    
        fetch(`${apiUrl}/dapur/${selectedOrder.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: true }),
        })
            .then((response) => response.json())
            .then(() => {
                const id = selectedOrder.id;
                setSelectedOrder(null);
    
                // Update status pesanan yang relevan
                setOrders((prevOrders) => {
                    const updatedOrders = prevOrders.map((order) =>
                        order.id === id ? { ...order, action: true, status: 'Siap Antar' } : order
                    );
    
                    // Urutkan berdasarkan status dan ID secara ascending untuk mengikuti FIFO
                    updatedOrders.sort((a, b) => {
                        // Urutkan berdasarkan status
                        const statusOrder = {
                            "Belum Dibuat": 1,
                            "Siap Antar": 2,
                            "Pegawai selesai mengantar": 3
                        };
    
                        const statusA = statusOrder[a.status] || 4;
                        const statusB = statusOrder[b.status] || 4;
    
                        // Jika status berbeda, urutkan berdasarkan status
                        if (statusA !== statusB) {
                            return statusA - statusB;
                        }
    
                        // Jika status sama, urutkan berdasarkan ID (Ascending, untuk FIFO)
                        return a.id - b.id; // Ascending untuk FIFO
                    });
    
                    return updatedOrders;
                });
            })
            .catch((error) => console.error("Error updating order:", error));
    };
    
    
    return (
        <div className="container mx-auto px-4 mt-3">
            <h1 className="text-2xl font-bold mb-4 text-white">Order List</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg">
                    <thead>
                        <tr className="bg-gray-100 border-b text-black">
                            <th className="py-2 px-4 text-center">Order ID</th>
                            <th className="py-2 px-4 text-center">Table ID</th>
                            <th className="py-2 px-4 text-center">Total Price</th>
                            <th className="py-2 px-4 text-center">Order Items</th>
                            <th className="py-2 px-4 text-center">Status Orders</th>
                            <th className="py-2 px-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders && orders.length > 0 ? (
                            orders.map((order) => (
                                <tr key={order.id} className="border-b hover:bg-gray-50 text-black">
                                    <td className="py-2 px-4 text-center">{order.id}</td>
                                    <td className="py-2 px-4 text-center">{order.table_id}</td>
                                    <td className="py-2 px-4 text-center">
                                        {order.total_price?.toLocaleString("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                        })}
                                    </td>
                                    <td className="py-2 px-4">
                                        {order.order_items?.length > 0 ? (
                                            <ul>
                                                {order.order_items.map((item) => (
                                                    <li key={item.id}>
                                                        {item.product_name} - {item.quantity}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 text-center">{order.status}</td>
                                    <td className="py-2 px-4 text-center">
                                        {order.action ? (
                                            <span className="text-green-600 font-bold">✔ Selesai</span>
                                        ) : (
                                            <button
                                                className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                                                onClick={() => handleCheckOrder(order)}
                                            >
                                                ✔
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-black">
                                    No orders available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-semibold text-black">Konfirmasi</h2>
                        <p className="text-black">Apakah pesanan ini sudah selesai?</p>
                        <div className="flex justify-end mt-4">
                            <button
                                className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-lg mr-2"
                                onClick={() => setSelectedOrder(null)}
                            >
                                Batal
                            </button>
                            <button
                                className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                onClick={confirmOrder}
                            >
                                Ya, Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DapurList;
