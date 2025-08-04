import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Clientes from "./pages/Cliente";
import Facturacion from "./pages/Facturaciones";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/clientes",
        element: <Clientes />,
      },
      {
        path: "/facturaciones",
        element: <Facturacion />,
      },

      
    ],
  },
]);

export default router;
