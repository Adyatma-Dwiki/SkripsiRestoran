import { useState, useEffect } from "react";
import CheckoutButton from "./checkoutButton";
import ConfirmationButton from "./ConfirmationButton";

const ShoppingCart = () => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [tableID, setTableID] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false); // State untuk dialog konfirmasi

  const apiUrl = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [menuMakanan, menuMinuman, menuSnacks] = await Promise.all([
          fetch(`${apiUrl}/menuMakanan`)
            .then((res) => res.json())
            .then((result) => result.data || result),
          fetch(`${apiUrl}/menuMinuman`)
            .then((res) => res.json())
            .then((result) => result.data || result),
          fetch(`${apiUrl}/menuSnacks`)
            .then((res) => res.json())
            .then((result) => result.data || result),
        ]);

        const allProducts = [...menuMakanan, ...menuMinuman, ...menuSnacks];
        setProducts(allProducts);

        const initialQuantities = allProducts.reduce((acc, product, index) => {
          acc[`${product.id}-${index}`] = 0;
          return acc;
        }, {});
        setQuantities(initialQuantities);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const increaseQuantity = (id, index) => {
    setQuantities((prevQuantities) => {
      const currentQuantity = prevQuantities[`${id}-${index}`] || 0; // Ambil nilai saat ini, jika ada
      return {
        ...prevQuantities,
        [`${id}-${index}`]: currentQuantity + 1, // Tambahkan 1 pada nilai yang ada
      };
    });
  };

  const decreaseQuantity = (id, index) => {
    setQuantities((prevQuantities) => {
      const currentQuantity = prevQuantities[`${id}-${index}`] || 0; // Ambil nilai saat ini, jika ada
      return {
        ...prevQuantities,
        [`${id}-${index}`]: currentQuantity - 1, // Kurangi 1 pada nilai yang ada
      };
    });
  };

  const totalHarga = products.reduce((acc, product, index) => {
    const quantity = quantities[`${product.id}-${index}`] || 0;
    return acc + product.Harga * quantity;
  }, 0);

  // Fungsi untuk menampilkan konfirmasi
  const confirmCheckout = () => {
    setShowConfirmation(true); // Tampilkan dialog konfirmasi
  };

  // Fungsi untuk menangani checkout setelah konfirmasi
  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    const order_items = products
      .map((product, index) => {
        const quantity = quantities[`${product.id}-${index}`];
        if (quantity > 0) {
          return {
            product_name: product.Nama,
            quantity: quantity,
            price: product.Harga,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    const requestData = {
      table_id: tableID,
      total_price: totalHarga,
      order_items: order_items,
    };

    console.log("Data yang dikirim ke backend:", requestData);

    try {
      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Terjadi kesalahan saat memproses order.");
      }

      const data = await response.json();
      alert("Order berhasil dibuat!");
      console.log(data);

      // Reset state setelah order berhasil
      setTableID("");
      setQuantities(products.reduce((acc, product, index) => {
        acc[`${product.id}-${index}`] = 0;
        return acc;
      }, {}));
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
      setShowConfirmation(false); // Tutup dialog konfirmasi
    }
  };

  return (
    <>
      {showConfirmation && (
        <ConfirmationButton
          onCancel={() => setShowConfirmation(false)} // Tutup dialog jika batal
          onConfirm={handleCheckout} // Lanjutkan proses checkout
        />
      )}
      <div className="flex flex-col md:flex-row justify-center items-center w-screen min-h-screen bg-slate-950 p-4">
        <div className="flex flex-col md:flex-row justify-between gap-6 p-4 bg-white shadow-lg rounded-lg max-w-screen-lg w-full mt-20">
          {/* Left: Cart Items */}
          <div className="w-full md:w-2/3 space-y-4">
            <h2 className="text-xl font-bold text-black">Pesanan Anda</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {products.map((product, index) => (
                <div key={`${product.id}-${index}`} className="flex flex-col sm:flex-row justify-between items-center border p-4 rounded text-black">
                  <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <img src={`${apiUrl}/${product.image}`} alt={product.Nama} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md" />
                    <div>
                      <h3 className="font-bold">{product.Nama}</h3>
                      <p>Rp {new Intl.NumberFormat("id-ID").format(product.Harga)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0">
                    <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => decreaseQuantity(product.id, index)}>-</button>
                    <input
                      type="number"
                      min="0"
                      value={quantities[`${product.id}-${index}`] || ""}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (/^\d*$/.test(newValue)) {
                          setQuantities((prev) => ({ ...prev, [`${product.id}-${index}`]: newValue !== "" ? Number(newValue) : "" }));
                        }
                      }}
                      className="border px-2 py-1 rounded text-black w-12 text-center"
                    />
                    <button className="bg-gray-200 px-3 py-1 rounded" onClick={() => increaseQuantity(product.id, index)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="w-full md:w-1/3 p-6 border rounded-lg text-black md:mt-0 mt-6">
            <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <p>Meja</p>
                <input type="number" value={tableID} onChange={(e) => setTableID(e.target.value)} placeholder="Isi nomor meja" className="border px-2 py-1 rounded text-black w-20 text-center" />
              </div>
              <div className="flex justify-between">
                <p>{Object.values(quantities).reduce((acc, qty) => acc + qty, 0)} Items</p>
              </div>
              <div className="flex justify-between">
                <p>Total</p>
                <p>Rp {totalHarga.toLocaleString("id-ID")}</p>
              </div>
              <CheckoutButton onCheckout={confirmCheckout} loading={loading} tableID={tableID} totalHarga={totalHarga} />
              {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
          </div>
        </div>
      </div>

    </>
  );
};


export default ShoppingCart;
