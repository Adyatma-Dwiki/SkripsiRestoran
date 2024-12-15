/* eslint-disable react/prop-types */
const CheckoutButton = ({ onCheckout, loading, tableID, totalHarga }) => {
    return (
      <button
        className="w-full bg-black text-white py-2 rounded mt-4"
        onClick={onCheckout}
        disabled={loading || !tableID || totalHarga === 0}
      >
        {loading ? "Processing..." : "Checkout"}
      </button>
    );
  };
  
  export default CheckoutButton;
  