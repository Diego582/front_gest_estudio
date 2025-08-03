import { configureStore } from "@reduxjs/toolkit";
import clienteReducer from "./reducer/cliente";

export default configureStore({
  reducer: {clientes: clienteReducer},
});
