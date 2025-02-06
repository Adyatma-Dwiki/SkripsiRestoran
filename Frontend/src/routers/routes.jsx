import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../Layout/RootLayout"; // Pastikan path ini benar
import Homepage from "../pages/homepage";
import Checkout from "../pages/checkout";
import DapurList from "../components/dapurList";


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
      {
        path: "/Dapur",
        element: <DapurList />,
      }
    ],
  },
]);
