import { configureStore } from "@reduxjs/toolkit";
import { facturaCacheMiddleware } from "./actions/facturas";
import clienteReducer from "./reducer/cliente";
import facturaReducer from "./reducer/factura";
import itemFacturaReducer from "./reducer/itemFactura";
import ivaReducer from "./reducer/iva";
import personaReducer from "./reducer/persona";

export default configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(facturaCacheMiddleware),
  reducer: {
    clientes: clienteReducer,
    factura: facturaReducer,
    itemFactura: itemFacturaReducer,
    iva: ivaReducer,
    perosonas: personaReducer,
  },
});
