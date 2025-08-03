import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Edit, Delete, Search } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import clienteActions from "../store/actions/clientes";
import Swal from "sweetalert2";

const ivaOptions = ["Responsable Inscripto", "Monotributo"];

const initialForm = {
  razon_social: "",
  cuit: "",
  condicion_iva: "",
  direccion: "",
  localidad: "",
  provincia: "",
  telefono: "",
  email: "",
  activo: true,
};

export default function Clientes() {
  const dispatch = useDispatch();

  // Redux state
  const clientes = useSelector((state) => state.clientes.clientes);
  const loading = useSelector((state) => state.clientes.loading);
  const error = useSelector((state) => state.clientes.error);

  // Local state
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);

  // Load clientes on mount and when search changes
  useEffect(() => {
    dispatch(clienteActions.fetchClientes({ search }));
  }, [dispatch]);

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.razon_social.toLowerCase().includes(search.toLowerCase()) ||
      cliente.cuit.toLowerCase().includes(search.toLowerCase())
  );


  // Handlers
  const handleSearchChange = (e) => setSearch(e.target.value);

  const openCreate = () => {
    setForm(initialForm);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (cliente) => {
    setForm(cliente);
    setEditId(cliente._id);
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await dispatch(
          clienteActions.updateCliente({ id: editId, clienteData: form })
        ).unwrap();
        Swal.fire(
          "Actualizado",
          "Cliente actualizado correctamente",
          "success"
        );
      } else {
        await dispatch(clienteActions.createCliente(form)).unwrap();
        Swal.fire("Creado", "Cliente creado correctamente", "success");
      }
      closeModal();
      dispatch(clienteActions.fetchClientes({ search }));
    } catch (err) {
      Swal.fire("Error", err?.message || "Error al guardar cliente", "error");
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "¿Confirma eliminar este cliente?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(clienteActions.deleteCliente({ id })).unwrap();
          Swal.fire("Eliminado", "Cliente eliminado correctamente", "success");
          dispatch(clienteActions.fetchClientes({ search }));
        } catch (err) {
          Swal.fire(
            "Error",
            err?.message || "Error al eliminar cliente",
            "error"
          );
        }
      }
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={500}>
          Clientes
        </Typography>
        <Button variant="contained" onClick={openCreate}>
          Nuevo Cliente
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Buscar por razón social o CUIT"
        variant="outlined"
        size="small"
        value={search}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Razón Social</TableCell>
              <TableCell>CUIT</TableCell>
              <TableCell>Condición IVA</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && filteredClientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron clientes.
                </TableCell>
              </TableRow>
            )}
            {filteredClientes.map((cliente) => (
              <TableRow key={cliente._id}>
                <TableCell>{cliente.razon_social}</TableCell>
                <TableCell>{cliente.cuit}</TableCell>
                <TableCell>{cliente.condicion_iva}</TableCell>
                <TableCell>{cliente.telefono || "-"}</TableCell>
                <TableCell>{cliente.email || "-"}</TableCell>
                <TableCell>{cliente.activo ? "Sí" : "No"}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton onClick={() => openEdit(cliente)} size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      onClick={() => handleDelete(cliente._id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Form */}
      <Dialog open={open} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
            noValidate
            autoComplete="off"
          >
            <TextField
              label="Razón Social"
              name="razon_social"
              value={form.razon_social}
              onChange={handleFormChange}
              required
              fullWidth
            />
            <TextField
              label="CUIT"
              name="cuit"
              value={form.cuit}
              onChange={handleFormChange}
              required
              fullWidth
              inputProps={{ maxLength: 11, pattern: "\\d{11}" }}
              helperText="11 dígitos numéricos sin guiones"
            />
            <TextField
              select
              label="Condición IVA"
              name="condicion_iva"
              value={form.condicion_iva}
              onChange={handleFormChange}
              required
              fullWidth
            >
              {ivaOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Localidad"
              name="localidad"
              value={form.localidad}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Provincia"
              name="provincia"
              value={form.provincia}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleFormChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleFormChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editId ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
