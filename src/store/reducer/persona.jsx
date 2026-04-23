import { createReducer } from "@reduxjs/toolkit";
import personaActions from "../actions/personas";

const {
  fetchPersonaByDocumento,
  fetchPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
} = personaActions;

const initialState = {
  personas: [],
  persona: null,
  loading: false,
  error: null,
  messages: [],
};

const personaReducer = createReducer(initialState, (builder) => {
  builder
    // 🔍 FETCH BY DOCUMENTO
    .addCase(fetchPersonaByDocumento.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchPersonaByDocumento.fulfilled, (state, action) => {
      state.loading = false;
      state.persona = action.payload; // puede ser null
    })
    .addCase(fetchPersonaByDocumento.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // 🔍 FETCH BY ID
    .addCase(fetchPersonaById.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchPersonaById.fulfilled, (state, action) => {
      state.loading = false;
      state.persona = action.payload;
    })
    .addCase(fetchPersonaById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message;
    })

    // ➕ CREATE
    .addCase(createPersona.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(createPersona.fulfilled, (state, action) => {
      state.loading = false;
      state.personas.push(action.payload);
      state.messages = ["Persona creada correctamente"];
    })
    .addCase(createPersona.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // ✏️ UPDATE
    .addCase(updatePersona.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(updatePersona.fulfilled, (state, action) => {
      state.loading = false;

      const index = state.personas.findIndex(
        (p) => p._id === action.payload._id
      );

      if (index !== -1) {
        state.personas[index] = action.payload;
      }

      state.messages = ["Persona actualizada correctamente"];
    })
    .addCase(updatePersona.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    })

    // ❌ DELETE
    .addCase(deletePersona.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(deletePersona.fulfilled, (state, action) => {
      state.loading = false;

      state.personas = state.personas.filter(
        (p) => p._id !== action.payload._id
      );

      state.messages = ["Persona eliminada correctamente"];
    })
    .addCase(deletePersona.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload?.message || action.error.message;
    });
});

export default personaReducer;