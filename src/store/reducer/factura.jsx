import { createReducer } from "@reduxjs/toolkit";
import facturaActions from "../actions/facturas";
import { createItemFactura } from "../actions/itemsFacturas";
import { fetchClientes } from "../actions/clientes";

const {
  fetchFacturas,
  fetchFacturaById,
  createFactura,
  updateFactura,
  deleteFactura,
} = facturaActions;

const initialState = {
  clientes: [],
  facturas: [],
  factura: null,
  loading: false,
  error: null,
  messages: [],
};

const facturaReducer = createReducer(initialState, (builder) => {
  builder
    // Carga de Clientes
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

    // Carga de todas las Facturas
    .addCase(fetchFacturas.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchFacturas.fulfilled, (state, action) => {
      state.loading = false;
      state.facturas = action.payload;
    })
    .addCase(fetchFacturas.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // Carga de una Factura por ID
    .addCase(fetchFacturaById.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchFacturaById.fulfilled, (state, action) => {
      state.loading = false;
      state.factura = action.payload;
    })
    .addCase(fetchFacturaById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // Crear Factura (modo clásico)
    .addCase(createFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createFactura.fulfilled, (state, action) => {
      state.loading = false;
      state.facturas.push(action.payload);
      state.messages = ["Factura creada correctamente"];
    })
    .addCase(createFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // Crear Factura con Items
    .addCase(createItemFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createItemFactura.fulfilled, (state, action) => {
      state.loading = false;
      state.facturas.push(action.payload);
      state.messages = ["Factura con items creada correctamente"];
    })
    .addCase(createItemFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // Actualizar Factura
    .addCase(updateFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateFactura.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.facturas.findIndex(
        (f) => f._id === action.payload._id
      );
      if (index !== -1) {
        state.facturas[index] = action.payload;
      }
      state.messages = ["Factura actualizada correctamente"];
    })
    .addCase(updateFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // Eliminar Factura
    .addCase(deleteFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deleteFactura.fulfilled, (state, action) => {
      state.loading = false;
      state.facturas = state.facturas.filter(
        (f) => f._id !== action.payload._id
      );
      state.messages = ["Factura eliminada correctamente"];
    })
    .addCase(deleteFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })
    .addCase("BULK_CREATE_FACTURAS_SUCCESS", (state, action) => {
      state.facturas = [...state.facturas, ...action.payload];
      state.error = null;
      state.messages = ["Facturas importadas correctamente"];
    })
    .addCase("BULK_CREATE_FACTURAS_FAIL", (state, action) => {
      state.error = action.payload;
    });
});

export default facturaReducer;
