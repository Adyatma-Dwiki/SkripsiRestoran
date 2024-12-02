import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../Layout/RootLayout"; // Pastikan path ini benar
import Homepage from "../pages/homepage";
import Checkout from "../pages/checkout";


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
        pat: "/Checkout",
        element: <Checkout />,
      }
    ],
  },
]);
