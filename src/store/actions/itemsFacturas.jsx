import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiUrl from "../../utils/apiUrl";

// FETCH items por factura_id
export const fetchItemsFactura = createAsyncThunk(
  "itemsfacturas/fetchByFactura",
  async ({ facturaId }) => {
    try {
      const response = await axios.get(
        `${apiUrl}itemsfacturas?factura_id=${facturaId}`
      );
      return response.data.response || [];
    } catch (error) {
      return [];
    }
  }
);

// CREATE
export const createItemFactura = createAsyncThunk(
  "itemsfacturas/create",
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}itemsfacturas`, itemData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// UPDATE
export const updateItemFactura = createAsyncThunk(
  "itemsfacturas/update",
  async ({ id, itemData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}itemsfacturas/${id}`, itemData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// DELETE
export const deleteItemFactura = createAsyncThunk(
  "itemsfacturas/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}itemsfacturas/${id}`);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

const itemFacturaActions = {
  fetchItemsFactura,
  createItemFactura,
  updateItemFactura,
  deleteItemFactura,
};

export default itemFacturaActions;
