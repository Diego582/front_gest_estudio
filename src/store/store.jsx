import { configureStore } from "@reduxjs/toolkit";
import clienteReducer from "./reducer/cliente";
import facturaReducer from "./reducer/factura";
import itemFacturaReducer from "./reducer/itemFactura";
import ivaReducer from "./reducer/iva";

export default configureStore({
  reducer: {
    clientes: clienteReducer,
    factura: facturaReducer,
    itemFactura: itemFacturaReducer,
    iva: ivaReducer,
  },
});
