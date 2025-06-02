/* eslint-disable react/no-unescaped-entities */
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
                        const existingOrder = newOrders[index];
                        const updatedOrder = {
                            ...existingOrder,
                            ...update,
                            status: update.status || existingOrder.status,
                        };

                        newOrders[index] = updatedOrder;
                    } else {
                        newOrders.push({
                            ...update,
                            status: "Belum Dibuat",
                        });
                    }
                });

                // Pisahkan menjadi dua grup
                const ongoingOrders = newOrders.filter(
                    (order) => order.status !== "Pegawai selesai mengantar"
                );
                const finishedOrders = newOrders.filter(
                    (order) => order.status === "Pegawai selesai mengantar"
                );

                // Kedua grup tetap diurutkan berdasarkan ID
                ongoingOrders.sort((a, b) => a.id - b.id);
                finishedOrders.sort((a, b) => a.id - b.id);

                return [...ongoingOrders, ...finishedOrders];
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

                    // Pisahkan ongoing dan finished
                    const ongoingOrders = updatedOrders.filter(
                        (order) => order.status !== "Pegawai selesai mengantar"
                    );
                    const finishedOrders = updatedOrders.filter(
                        (order) => order.status === "Pegawai selesai mengantar"
                    );

                    ongoingOrders.sort((a, b) => a.id - b.id);
                    finishedOrders.sort((a, b) => a.id - b.id);

                    return [...ongoingOrders, ...finishedOrders];
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
                            <th className="py-2 px-4 text-center">Confirm By</th>
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
                                    <td className="py-2 px-4 text-center">
                                        {order.device_id ? (
                                            <span className="text-black font-bold">{order.device_id}</span>
                                        ) : (
                                            <span className="text-black-500 italic">Menunggu konfirmasi</span>
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
            <button
                className="fixed bottom-4 right-4 z-50 bg-yellow-500 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg shadow-lg"
                onClick={() => {
                    const readyOrders = orders.filter(order => order.status === 'Siap Antar');
                    readyOrders.forEach(order => {
                        fetch(`${apiUrl}/dapur/ws/blast`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(order),
                        }).then(res => {
                            if (!res.ok) throw new Error("Gagal blast order");
                        }).catch(err => {
                            console.error("Blast error:", err);
                        });
                    });
                }}
            >
                🔁 Blast Ulang Order "Siap Antar"
            </button>


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
