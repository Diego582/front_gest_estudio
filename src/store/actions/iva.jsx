import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiUrl from "../../utils/apiUrl";

// EXPORTAR IVA (ZIP)
export const exportarIVA = createAsyncThunk(
  "iva/exportar",
  async ({ clienteId, mes, anio, tipo }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiUrl}iva/`, {
        params: { clienteId, mes, anio, tipo },
        responseType: "blob", // 🔥 clave para archivos
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

const ivaActions = {
  exportarIVA,
};

export default ivaActions;
