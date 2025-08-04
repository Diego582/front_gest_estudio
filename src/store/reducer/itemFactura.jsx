import { createReducer } from "@reduxjs/toolkit";
import itemFacturaActions from "../actions/itemsFacturas";

const {
  fetchItemsFactura,
  createItemFactura,
  updateItemFactura,
  deleteItemFactura,
} = itemFacturaActions;

const initialState = {
  items: [],
  loading: false,
  error: null,
  messages: [],
};

const itemFacturaReducer = createReducer(initialState, (builder) => {
  builder
    // FETCH
    .addCase(fetchItemsFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchItemsFactura.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    })
    .addCase(fetchItemsFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // CREATE
    .addCase(createItemFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createItemFactura.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
      state.messages = ["Item agregado correctamente"];
    })
    .addCase(createItemFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // UPDATE
    .addCase(updateItemFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updateItemFactura.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.items.findIndex(
        (item) => item._id === action.payload._id
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      state.messages = ["Item actualizado correctamente"];
    })
    .addCase(updateItemFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // DELETE
    .addCase(deleteItemFactura.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deleteItemFactura.fulfilled, (state, action) => {
      state.loading = false;
      state.items = state.items.filter(
        (item) => item._id !== action.payload._id
      );
      state.messages = ["Item eliminado correctamente"];
    })
    .addCase(deleteItemFactura.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });
});

export default itemFacturaReducer;
