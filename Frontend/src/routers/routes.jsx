import { createBrowserRouter } from "react-router-dom";

import RootLayout from "../Layout/RootLayout";

export const router = createBrowserRouter([
   {
    path : "/",
    element : <RootLayout />,
      
   },
]);