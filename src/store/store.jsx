import { configureStore } from "@reduxjs/toolkit";
import clienteReducer from "./reducer/cliente";
import facturaReducer from "./reducer/factura";
import itemFacturaReducer from "./reducer/itemFactura";

export default configureStore({
  reducer: {
    clientes: clienteReducer,
    factura: facturaReducer,
    itemFactura: itemFacturaReducer,
  },
});
