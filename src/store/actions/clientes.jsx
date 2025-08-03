import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiUrl from "../../utils/apiUrl";

export const fetchClientes = createAsyncThunk(
  "clientes/fetchAll",
  async ({ search = "" }) => {
    try {
      const response = await axios.get(`${apiUrl}clientes?search=${search}`);
      return response.data.response || [];
    } catch (error) {
      return [];
    }
  }
);

export const fetchClienteById = createAsyncThunk(
  "clientes/fetchById",
  async ({ id }) => {
    try {
      const response = await axios.get(`${apiUrl}clientes/${id}`);
      return response.data.response || null;
    } catch (error) {
      return null;
    }
  }
);

export const createCliente = createAsyncThunk(
  "clientes/create",
  async (clienteData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}clientes`, clienteData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const updateCliente = createAsyncThunk(
  "clientes/update",
  async ({ id, clienteData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}clientes/${id}`, clienteData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const deleteCliente = createAsyncThunk(
  "clientes/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}clientes/${id}`);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

const clienteActions = {
  fetchClientes,
  fetchClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
};

export default clienteActions;
