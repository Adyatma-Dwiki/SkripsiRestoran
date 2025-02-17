import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../Layout/RootLayout";
import Homepage from "../pages/homepage";
import Checkout from "../pages/checkout";
import DapurList from "../components/dapurList";
import LoginPage from "../pages/loginPage"; // Pastikan ada halaman login
import ProtectedRoute from "../components/protectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Homepage />,
      },
      {
        path: "/Checkout",
        element: <Checkout />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />, // Halaman login
  },
  {
    path: "/Dapur",
    element: (
      <ProtectedRoute>
        <DapurList />
      </ProtectedRoute>
    ),
  },
]);
