/* eslint-disable react/prop-types */
import confirmImage from '../images/confirm.png'; // Import image properly

const ConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-2xl w-11/12 sm:w-96 md:w-1/2 lg:w-1/3 text-center space-y-6">
        {/* Use imported image */}
        <img
          src={confirmImage}
          alt="Confirmation"
          className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6" // Responsive image size
        />

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
          Apakah kamu yakin dengan pesanan ini?
        </h2>
        
        <div className="flex justify-center gap-4 sm:gap-6">
          <button
            onClick={onConfirm}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transform transition-all duration-300 ease-in-out hover:scale-105"
          >
            Ya!
          </button>
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transform transition-all duration-300 ease-in-out hover:scale-105"
          >
            Belum
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
