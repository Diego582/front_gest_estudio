import { createReducer } from "@reduxjs/toolkit";
import clienteActions from "../actions/clientes";

const {
  fetchClientes,
  createCliente,
  deleteCliente,
  fetchClienteById,
  updateCliente,
} = clienteActions;

const initialState = {
  clientes: [],
  cliente: null,
  loading: false,
  error: null,
  messages: [],
};

const clienteReducer = createReducer(initialState, (builder) => {
  builder
    // FETCH LIST
    .addCase(fetchClientes.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchClientes.fulfilled, (state, action) => {
      state.loading = false;
      state.clientes = action.payload;
    })
    .addCase(fetchClientes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // FETCH ONE
    .addCase(fetchClienteById.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchClienteById.fulfilled, (state, action) => {
      state.loading = false;
      state.cliente = action.payload;
    })
    .addCase(fetchClienteById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // CREATE
    .addCase(createCliente.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createCliente.fulfilled, (state, action) => {
      state.loading = false;
      state.clientes.push(action.payload);
      state.messages = ["Cliente creado correctamente"];
    })
    .addCase(createCliente.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // UPDATE
    .addCase(updateCliente.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateCliente.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.clientes.findIndex(
        (c) => c._id === action.payload._id
      );
      if (index !== -1) {
        state.clientes[index] = action.payload;
      }
      state.messages = ["Cliente actualizado correctamente"];
    })
    .addCase(updateCliente.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // DELETE
    .addCase(deleteCliente.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deleteCliente.fulfilled, (state, action) => {
      state.loading = false;
      // Suponemos que action.payload tiene el _id del cliente eliminado
      state.clientes = state.clientes.filter(
        (c) => c._id !== action.payload._id
      );
      state.messages = ["Cliente eliminado correctamente"];
    })
    .addCase(deleteCliente.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });
});

export default clienteReducer;