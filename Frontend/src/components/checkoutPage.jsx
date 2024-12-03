
const CheckoutPage = () => {
  // Daftar produk di keranjang

//   const [shipping, setShipping] = useState('Second Delivery');
//   const [promoCode, setPromoCode] = useState('');
//   const [discount, setDiscount] = useState(0);

  // Menghitung total
//   const totalPrice = products.reduce((acc, product) => acc + product.price * product.quantity, 0);
//   const shippingCost = shipping === 'Second Delivery' ? 5 : 10;
//   const finalPrice = totalPrice + shippingCost - discount;

  return (
    <>
    <div className="flex justify-center items-center w-screen h-screen bg-slate-950">
      <div className="flex justify-between gap-10 p-8 bg-white shadow-lg rounded-lg max-w-screen-lg w-full">
        {/* Left: Cart Items */}
        <div className="w-2/3 space-y-4">
          <h2 className="text-xl font-bold text-">Shopping Cart (Items)</h2>
          <div className="space-y-4">
            {/* {products.map((product) => (
              <div key={product.id} className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center space-x-4">
                  <img src={product.image} alt={product.name} className="w-20 h-20 object-cover" />
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-gray-500">{product.category}</p>
                    <p className="text-gray-700">${product.price}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-2 py-1 border rounded">-</button>
                  <span>{product.quantity}</span>
                  <button className="px-2 py-1 border rounded">+</button>
                </div>
                <div className="text-right">${product.price * product.quantity}</div>
              </div>
            ))} */}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-1/3 p-6 border rounded-lg">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              {/* <p>{products.length} Items</p>
              <p>${totalPrice}</p> */}
            </div>
            <div className="flex justify-between">
              <p>Shipping</p>
              <select
                // value={shipping}
                // onChange={(e) => setShipping(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="Second Delivery">Second Delivery ($5.00)</option>
                <option value="First Delivery">First Delivery ($10.00)</option>
              </select>
            </div>
            <div className="flex justify-between">
              <p>Promo Code</p>
              <input
                type="text"
                // value={promoCode}
                // onChange={(e) => setPromoCode(e.target.value)}
                placeholder="xxxx xxxx xxxx"
                className="border px-2 py-1 rounded"
              />
              <button
                // onClick={() => setDiscount(promoCode === 'DISCOUNT' ? 5 : 0)} // Promo code logic
                // className="bg-black text-white px-4 py-2 rounded"
              >
                Apply
              </button>
            </div>
            <div className="flex justify-between">
              <p>Total</p>
              {/* <p>${finalPrice.toFixed(2)}</p> */}
            </div>
            <button className="w-full bg-purple-600 text-white py-2 rounded mt-4">Checkout</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CheckoutPage;
