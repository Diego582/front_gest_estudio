import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiUrl from "../../utils/apiUrl";
import Swal from "sweetalert2";

// Caché de lectura, únicamente en memoria. Invalidación global conservadora.
const cacheFacturas = new Map();
const escrituras = new Set();
let versionCache = 0;
const TTL = 30000;
const MAX_CONSULTAS = 8;
const MAX_FACTURAS = 2000;
const invalidarCache = () => { versionCache++; cacheFacturas.clear(); };

export const facturaCacheMiddleware = () => next => action => {
  const tipo = action.type || "";
  if (/^(facturas\/(create|update|delete|uploadExcel|uploadTxt)|itemsfacturas\/(create|update|delete))\/(pending|fulfilled|rejected)$/.test(tipo)) {
    invalidarCache();
    if (tipo.endsWith("/pending")) escrituras.add(action.meta.requestId);
    else escrituras.delete(action.meta.requestId);
  }
  return next(action);
};

// FETCH todas las facturas (filtradas por cliente si corresponde)
export const fetchFacturas = createAsyncThunk(
  "facturas/fetchAll",
  async ({ clienteId = "", tipo, mes, anio, fechaInicio, fechaFin } = {}, { signal, rejectWithValue }) => {
    try {
      const params = new URLSearchParams();

      if (clienteId) params.append("cliente_id", clienteId);
      for (const [key, value] of Object.entries({ tipo, mes, anio, fechaInicio, fechaFin })) {
        if (value !== undefined && value !== null && value !== "") params.append(key, value);
      }

      const clave = params.toString();
      const version = versionCache;
      const cacheable = Boolean(clienteId) && Boolean(tipo) && Number(mes) >= 1 && Number(mes) <= 12;
      const entrada = cacheFacturas.get(clave);
      if (cacheable && !escrituras.size && entrada && Date.now() - entrada.fecha < TTL && !signal.aborted) {
        cacheFacturas.delete(clave);
        cacheFacturas.set(clave, entrada);
        return entrada.datos;
      }
      cacheFacturas.delete(clave);
      const response = await axios.get(
        `${apiUrl}facturas?${clave}`, { signal }
      );
      const datos = response.data.response || [];
      if (cacheable && !signal.aborted && !escrituras.size && version === versionCache &&
          Array.isArray(datos) && datos.length <= MAX_FACTURAS) {
        cacheFacturas.set(clave, { fecha: Date.now(), datos });
        while (cacheFacturas.size > MAX_CONSULTAS) cacheFacturas.delete(cacheFacturas.keys().next().value);
      }
      return datos;
    } catch (error) {
      if (error.response?.status === 404) return [];
      return rejectWithValue(error.response?.data || { message: error.message });
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
  async (id, { rejectWithValue }) => {
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
  const escritura = Symbol();
  escrituras.add(escritura);
  invalidarCache();
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
  } finally {
    escrituras.delete(escritura);
    invalidarCache();
  }
};

export const uploadFacturasExcel = createAsyncThunk(
  "facturas/uploadExcel",
  async ({ file, clienteId, periodo }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clienteId", clienteId);
      formData.append("mes", periodo.mes);
      formData.append("anio", periodo.anio);

      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      const response = await axios.post(
        `${apiUrl}facturas/upload-excel`,
        formData
      );

      Swal.fire({
        icon: "success",
        title: "Carga finalizada",
        html: `
          <p><b>Insertadas:</b> ${response.data.insertadas}</p>
          <p><b>Actualizadas:</b> ${response.data.actualizadas}</p>
          <p><b>Duplicadas:</b> ${response.data.duplicadas}</p>
          <p><b>Descartadas B:</b> ${response.data.descartadasB}</p>
          <p><b>Total procesadas:</b> ${response.data.total}</p>
        `,
        confirmButtonColor: "#3085d6",
      });

      // 👇 acá retorna TODAS las facturas del cliente
      return response.data.facturas || [];
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

export const uploadFacturasTxt = createAsyncThunk(
  "facturas/uploadTxt",
  async ({ ventasFile, alicuotasFile, clienteId }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("ventas", ventasFile);
      formData.append("alicuotas", alicuotasFile);
      formData.append("clienteId", clienteId);

      const response = await axios.post(
        `${apiUrl}facturas/upload-txt`,
        formData
      );

      Swal.fire({
        icon: "success",
        title: "Carga finalizada",
        html: `
          <p><b>Insertadas:</b> ${response.data.insertadas}</p>
          <p><b>Duplicadas:</b> ${response.data.duplicadas}</p>
          <p><b>Descartadas B:</b> ${response.data.descartadasB}</p>
          <p><b>Total procesadas:</b> ${response.data.total}</p>
        `,
        confirmButtonColor: "#3085d6",
      });

      return response.data.facturas || [];
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error en la carga TXT",
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
  uploadFacturasTxt,
};

export default facturaActions;
