import { createReducer } from "@reduxjs/toolkit";
import ivaActions from "../actions/iva";

const { exportarIVA } = ivaActions;

const initialState = {
  loading: false,
  error: null,
  messages: [],
};

const ivaReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(exportarIVA.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(exportarIVA.fulfilled, (state) => {
      state.loading = false;
      state.messages = ["Archivo IVA generado correctamente"];
    })
    .addCase(exportarIVA.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });
});

export default ivaReducer;