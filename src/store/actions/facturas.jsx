import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiUrl from "../../utils/apiUrl";
import Swal from "sweetalert2";

// FETCH todas las facturas (con filtro opcional)
export const fetchFacturas = createAsyncThunk(
  "facturas/fetchAll",
  async ({ search = "" } = {}) => {
    try {
      const response = await axios.get(`${apiUrl}facturas?search=${search}`);
      return response.data.response || [];
    } catch (error) {
      return [];
    }
  }
);

// FETCH factura por ID
export const fetchFacturaById = createAsyncThunk(
  "facturas/fetchById",
  async ({ id }) => {
    try {
      const response = await axios.get(`${apiUrl}facturas/${id}`);
      return response.data.response || null;
    } catch (error) {
      return null;
    }
  }
);

// CREATE factura
export const createFactura = createAsyncThunk(
  "facturas/create",
  async (facturaData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}facturas`, facturaData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// UPDATE factura
export const updateFactura = createAsyncThunk(
  "facturas/update",
  async ({ id, facturaData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}facturas/${id}`, facturaData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// DELETE factura
export const deleteFactura = createAsyncThunk(
  "facturas/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}facturas/${id}`);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const bulkCreateFacturas = (facturas) => async (dispatch) => {
  try {
    const response = await axios.post("/api/facturas/bulk", facturas);
    dispatch({
      type: "BULK_CREATE_FACTURAS_SUCCESS",
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: "BULK_CREATE_FACTURAS_FAIL",
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const uploadFacturasExcel = createAsyncThunk(
  "facturas/uploadExcel",
  async ({ file, clienteId }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clienteId", clienteId);

      const response = await axios.post(
        `${apiUrl}facturas/upload-excel`,
        formData
      );

      Swal.fire({
        icon: "success",
        title: "Carga completada",
        text: `${response.data.insertados} comprobantes cargados`,
        confirmButtonColor: "#3085d6",
      });

      return response.data.facturas || []; // 👈 backend debería devolver array de facturas
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error en la carga",
        text: error.response?.data?.message || "No se pudo procesar el archivo",
        confirmButtonColor: "#d33",
      });

      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

const facturaActions = {
  fetchFacturas,
  fetchFacturaById,
  createFactura,
  updateFactura,
  deleteFactura,
  bulkCreateFacturas,
  uploadFacturasExcel,
};

export default facturaActions;
