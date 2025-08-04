import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiUrl from "../../utils/apiUrl";

// FETCH items por factura_id
export const fetchItemsFactura = createAsyncThunk(
  "itemFactura/fetchByFactura",
  async ({ facturaId }) => {
    try {
      const response = await axios.get(
        `${apiUrl}itemfactura?factura_id=${facturaId}`
      );
      return response.data.response || [];
    } catch (error) {
      return [];
    }
  }
);

// CREATE
export const createItemFactura = createAsyncThunk(
  "itemFactura/create",
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}itemfactura`, itemData);
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
  "itemFactura/update",
  async ({ id, itemData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}itemfactura/${id}`, itemData);
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
  "itemFactura/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}itemfactura/${id}`);
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
