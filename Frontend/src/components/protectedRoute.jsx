import { Navigate } from "react-router-dom";
import PropTypes from "prop-types"; // ✅ Import PropTypes

const ProtectedRoute = ({ children }) => {
  const username = localStorage.getItem("username"); // Memeriksa apakah username ada di localStorage
  return username ? children : <Navigate to="/login" replace />;
};

// ✅ Tambahkan validasi props
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired, // Pastikan children adalah elemen React
};

export default ProtectedRoute;
