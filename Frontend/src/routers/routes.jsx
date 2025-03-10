import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../Layout/RootLayout";
import Homepage from "../pages/homepage";
import Checkout from "../pages/checkout";
import LoginPage from "../pages/loginPage";
import ProtectedRoute from "../components/protectedRoute";
import Dapur from "../pages/dapur";
import AddMenuMakanan from "../components/pagesCRUD/Add/AddMakanan";
import AddMenuMinuman from "../components/pagesCRUD/Add/AddMinuman";
import AddMenuSnack from "../components/pagesCRUD/Add/AddSnack";
import DeleteMakanan from "../components/pagesCRUD/Delete/DeleteMakanan";
import DeleteMinuman from "../components/pagesCRUD/Delete/DeleteMinuman";
import DeleteSnack from "../components/pagesCRUD/Delete/DeleteSnack";
import EditMakanan from "../components/pagesCRUD/Edit/EditMakanan";
import EditMinuman from "../components/pagesCRUD/Edit/EditMinuman";
import EditSnack from "../components/pagesCRUD/Edit/EditSnack";

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
        path: "/checkout",
        element: <Checkout />,
      },
      {
        path: "/dapur",
        element: (
          <ProtectedRoute>
            <Dapur />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/addMenuMakanan", 
        element: (
          <ProtectedRoute>
            <AddMenuMakanan />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/addMenuMinuman", 
        element: (
          <ProtectedRoute>
            <AddMenuMinuman />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/addMenuSnack", 
        element: (
          <ProtectedRoute>
            <AddMenuSnack />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/deleteMenuMakanan", 
        element: (
          <ProtectedRoute>
            <DeleteMakanan />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/deleteMenuMinuman", 
        element: (
          <ProtectedRoute>
            <DeleteMinuman />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/deleteMenuSnack", 
        element: (
          <ProtectedRoute>
            <DeleteSnack/>
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/editMenuMakanan", 
        element: (
          <ProtectedRoute>
            <EditMakanan/>
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/editMenuMinuman", 
        element: (
          <ProtectedRoute>
            <EditMinuman/>
          </ProtectedRoute>
        ),
      },
      {
        path: "/dapur/editMenuSnack", 
        element: (
          <ProtectedRoute>
            <EditSnack/>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);
