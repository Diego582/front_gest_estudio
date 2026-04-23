import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiUrl from "../../utils/apiUrl";

// 🔍 Buscar persona por documento
export const fetchPersonaByDocumento = createAsyncThunk(
  "personas/fetchByDocumento",
  async ({ tipo, numero }) => {
    try {
      const response = await axios.get(
        `${apiUrl}personas/by-documento/${tipo}/${numero}`
      );

      return response.data.response || null;
    } catch (error) {
      return null;
    }
  }
);

// 🔍 Buscar por ID (lo mantenemos por consistencia)
export const fetchPersonaById = createAsyncThunk(
  "personas/fetchById",
  async ({ id }) => {
    try {
      const response = await axios.get(`${apiUrl}personas/${id}`);
      return response.data.response || null;
    } catch (error) {
      return null;
    }
  }
);

// ➕ Crear persona
export const createPersona = createAsyncThunk(
  "personas/create",
  async (personaData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${apiUrl}personas`, personaData);

      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// ✏️ (opcional) actualizar
export const updatePersona = createAsyncThunk(
  "personas/update",
  async ({ id, personaData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${apiUrl}personas/${id}`, personaData);

      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// ❌ (opcional) eliminar
export const deletePersona = createAsyncThunk(
  "personas/delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${apiUrl}personas/${id}`);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

const personaActions = {
  fetchPersonaByDocumento,
  fetchPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
};

export default personaActions;
