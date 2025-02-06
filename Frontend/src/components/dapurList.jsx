import { useEffect, useState } from "react";

const DapurList = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetch(`${apiUrl}/dapur`)
            .then((response) => response.json())
            .then((result) => {
                console.log(result);
                setOrders(result.data);
            })
            .catch((error) => console.error("Error:", error));
    }, []);

    // Fungsi untuk menangani klik tombol ceklis
    const handleCheckOrder = (order) => {
        setSelectedOrder(order);
    };

    // Fungsi untuk konfirmasi update status pesanan
    const confirmOrder = () => {
        if (!selectedOrder) return;

        fetch(`${apiUrl}/dapur/${selectedOrder.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: true }),
        })
            .then((response) => response.json())
            .then(() => {
                // Update state lokal setelah berhasil update
                setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                        order.id === selectedOrder.id ? { ...order, action: true } : order
                    )
                );
                setSelectedOrder(null); // Tutup popup
            })
            .catch((error) => console.error("Error updating order:", error));
    };

    return (
        <div className="container mx-auto p-7 mt-28">
            <h1 className="text-2xl font-bold mb-4">Order List</h1>
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
                        {orders.length > 0 ? (
                            orders.map((order) => (
                                <tr key={order.id} className="border-b hover:bg-gray-50 text-black">
                                    <td className="py-2 px-4 text-center">{order.id}</td>
                                    <td className="py-2 px-4 text-center">{order.table_id}</td>
                                    <td className="py-2 px-4 text-center">
                                        {order.total_price.toLocaleString("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                        })}
                                    </td>
                                    <td className="py-2 px-4">
                                        <ul>
                                            {order.order_items.map((item) => (
                                                <li key={item.id}>
                                                    {item.product_name} - {item.quantity}
                                                </li>
                                            ))}
                                        </ul>
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
                                <td colSpan="6" className="text-center py-4">No orders available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pop-up konfirmasi */}
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
