import { createTheme } from "@mui/material/styles";

// Paleta suave para sistema contable
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3f51b5", // Azul grisáceo
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#81c784", // Verde suave
      contrastText: "#ffffff",
    },
    error: {
      main: "#e57373", // Rojo claro
    },
    warning: {
      main: "#fff176", // Amarillo suave
    },
    background: {
      default: "#f4f6f8", // Fondo general
      paper: "#ffffff",   // Fondo para tarjetas y paneles
    },
    text: {
      primary: "#212121",     // Texto principal
      secondary: "#616161",   // Texto secundario
    },
    divider: "#e0e0e0",       // Líneas suaves
  },

  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    fontSize: 14,
    h1: {
      fontSize: "2.2rem",
      fontWeight: 500,
    },
    h2: {
      fontSize: "1.8rem",
      fontWeight: 500,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },

  shape: {
    borderRadius: 8, // Bordes ligeramente redondeados
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none", // Quita sombras fuertes
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;

