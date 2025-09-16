import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Paper,
  IconButton,
  Tooltip,
  Grid,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchFacturas } from "../store/actions/facturas";
import { fetchClientes } from "../store/actions/clientes";
import { createItemFactura } from "../store/actions/itemsFacturas";
import { Add, UploadFile } from "@mui/icons-material";
import { tiposComprobantes } from "../utils/tipoComprobantes";
import * as XLSX from "xlsx";

const Facturacion = () => {
  const tiposIVA = [21, 10.5, 27];
  const tiposPercepcion = ["IVA", "IIBB"];
  const tiposRetencion = ["IVA", "IIBB"];

  const dispatch = useDispatch();
  const [search, setSearch] = useState("");

  // Redux state
  const { facturas, loading, error, messages } = useSelector(
    (state) => state.factura
  );
  const clientes = useSelector((state) => state.clientes.clientes);

  // Local state
  const [clienteId, setClienteId] = useState("");
  const [tipoFactura, setTipoFactura] = useState("emitida");
  const [openForm, setOpenForm] = useState(false);

  // Form state
  const [formFactura, setFormFactura] = useState({
    cliente_id: "",
    fecha: "",
    detalle: "",
    tipo: "emitida",
    codigo_comprobante: "",
    punto_venta: "",
    numero: "",
    cuit_dni: "",
    razon_social: "",
  });
  const [itemsAlicuota, setItemsAlicuota] = useState([
    {
      alicuotasIva: [{ tipo: "", netoGravado: 0, iva: 0 }],
    },
  ]);
  const [itemsPercepciones, setItemsPercepciones] = useState([
    {
      percepciones: [{ tipo: "", monto: 0 }],
    },
  ]);
  const [itemsRetenciones, setItemsRetenciones] = useState([
    {
      retenciones: [{ tipo: "", monto: 0 }],
    },
  ]);

  // Carga clientes al montar
  useEffect(() => {
    dispatch(fetchClientes(search ? { search } : {}));
  }, [dispatch]);

  // Carga facturas cuando cambia cliente o tipo
  useEffect(() => {
    if (clienteId) {
      dispatch(fetchFacturas({ clienteId, tipo: tipoFactura }));
    }
  }, [clienteId, tipoFactura, dispatch]);

  // Handlers para filtros
  const handleClienteChange = (e) => {
    setClienteId(e.target.value);
    setFormFactura((prev) => ({
      ...prev,
      cliente_id: e.target.value,
    }));
  };

  const handleTipoChange = (e) => {
    setTipoFactura(e.target.checked ? "emitida" : "recibida");
    setFormFactura((prev) => ({
      ...prev,
      tipo: e.target.checked ? "emitida" : "recibida",
    }));
  };

  // Form cambios
  const handleFormFacturaChange = (e) => {
    const { name, value } = e.target;
    setFormFactura((prev) => ({ ...prev, [name]: value }));
  };

  // Items dinámicos
  const handleItemChange = (index, field, subfield, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      if (subfield) {
        newItems[index][field][subfield] = value;
      } else {
        newItems[index][field] = value;
      }
      return newItems;
    });
  };

  /*  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        descripcion: "",
        excento: 0,
        alicuotasIva: [{ tipo: "", netoGravado: 0, iva: 0 }],
        percepciones: [{ tipo: "", monto: 0 }],
        retenciones: [{ tipo: "", monto: 0 }],
        impuestosInternos: 0,
        ITC: 0,
      },
    ]);
  }; */

  const addItem = (setState, newItem) => {
    setState((prev) => [...prev, newItem]);
  };

  const removeItem = (setState, index) => {
    setState((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form
  const handleSubmit = () => {
    dispatch(createItemFactura({ factura: formFactura, items }))
      .unwrap()
      .then(() => {
        setOpenForm(false);
        setFormFactura({
          cliente_id: "",
          fecha: "",
          detalle: "",
          tipo: tipoFactura,
          codigo_comprobante: "",
          punto_venta: "",
          numero: "",
          cuit_dni: "",
          razon_social: "",
        });
        setItems([
          {
            descripcion: "",
            excento: 0,
            alicuotasIva: [{ tipo: "", netoGravado: 0, iva: 0 }],
            percepciones: [{ tipo: "", monto: 0 }],
            retenciones: [{ tipo: "", monto: 0 }],
            impuestosInternos: 0,
            ITC: 0,
          },
        ]);
        dispatch(fetchFacturas({ clienteId, tipo: tipoFactura }));
      });
  };

  // Importar Excel o CSV
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    // Aquí debes mapear json para que encaje con tu backend y disparar acción redux
    console.log("Importado", json);
  };

  // Agrupación por fecha (simplificada)
  const groupedFacturas = facturas.reduce((acc, factura) => {
    const date = new Date(factura.fecha).toLocaleDateString();
    acc[date] = acc[date] || [];
    acc[date].push(factura);
    return acc;
  }, {});

  console.log(clientes, "esto es clientes");
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        gap={2}
      >
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="cliente-select-label">Cliente</InputLabel>
          <Select
            labelId="cliente-select-label"
            value={clienteId}
            label="Cliente"
            onChange={handleClienteChange}
            size="small"
          >
            {clientes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.razon_social}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl label="Tipo">
          <Typography
            component="div"
            sx={{ display: "flex", alignItems: "center" }}
          >
            Recibidas
            <Switch
              checked={tipoFactura === "emitida"}
              onChange={handleTipoChange}
              color="primary"
              inputProps={{ "aria-label": "Tipo factura" }}
            />
            Emitidas
          </Typography>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenForm(true)}
          disabled={!clienteId}
        >
          Nueva Factura
        </Button>

        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadFile />}
          disabled={!clienteId}
        >
          Importar Excel/CSV
          <input
            type="file"
            accept=".xlsx, .csv"
            hidden
            onChange={handleImport}
          />
        </Button>
      </Box>

      {/* Tabla Facturas agrupadas por fecha */}
      {Object.keys(groupedFacturas).length === 0 && (
        <Typography>No hay facturas para mostrar</Typography>
      )}

      {Object.entries(groupedFacturas).map(([date, facturasPorFecha]) => (
        <Box key={date} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {date}
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código Comprobante</TableCell>
                  <TableCell>Punto de Venta</TableCell>
                  <TableCell>Número</TableCell>
                  <TableCell>Detalle</TableCell>
                  <TableCell>CUIT/DNI</TableCell>
                  <TableCell>Razón Social</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {facturasPorFecha.map((f) => (
                  <TableRow key={f._id}>
                    <TableCell>{f.codigo_comprobante}</TableCell>
                    <TableCell>{f.punto_venta}</TableCell>
                    <TableCell>{f.numero}</TableCell>
                    <TableCell>{f.detalle}</TableCell>
                    <TableCell>{f.cuit_dni}</TableCell>
                    <TableCell>{f.razon_social}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      {/* Modal Formulario */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nueva Factura</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            noValidate
            autoComplete="off"
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            {/* Campos Factura */}

            <Box sx={{ mt: 2, width: "100%" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="cliente-select-label-modal">
                      Cliente
                    </InputLabel>
                    <Select
                      labelId="cliente-select-label-modal"
                      name="cliente_id"
                      value={formFactura.cliente_id}
                      label="Cliente"
                      onChange={handleFormFacturaChange}
                      size="small"
                      disabled
                    >
                      {clientes.map((c) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.razon_social}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="tipo-select-label">Tipo</InputLabel>
                    <Select
                      labelId="tipo-select-label"
                      name="tipo"
                      value={formFactura.tipo}
                      label="Tipo"
                      onChange={handleFormFacturaChange}
                      size="small"
                    >
                      <MenuItem value="emitida">Emitida</MenuItem>
                      <MenuItem value="recibida">Recibida</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Fecha"
                    name="fecha"
                    type="date"
                    value={formFactura.fecha}
                    onChange={handleFormFacturaChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    required
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 2, width: "100%" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Código Comprobante"
                    name="codigo_comprobante"
                    value={formFactura.codigo_comprobante}
                    onChange={handleFormFacturaChange}
                    fullWidth
                    size="small"
                    required
                  >
                    {tiposComprobantes.map((comp) => (
                      <MenuItem key={comp.codigo} value={comp.codigo}>
                        {comp.codigo} - {comp.descripcion}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Punto de Venta"
                    name="punto_venta"
                    type="number"
                    value={formFactura.punto_venta}
                    onChange={handleFormFacturaChange}
                    fullWidth
                    size="small"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Número"
                    name="numero"
                    type="number"
                    value={formFactura.numero}
                    onChange={handleFormFacturaChange}
                    fullWidth
                    size="small"
                    required
                  />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mt: 2, width: "100%" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Exento"
                    type="number"
                    fullWidth
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        "excento",
                        null,
                        parseFloat(e.target.value)
                      )
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Impuestos Internos"
                    type="number"
                    fullWidth
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        "impuestosInternos",
                        null,
                        parseFloat(e.target.value)
                      )
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label="ITC"
                    type="number"
                    fullWidth
                    onChange={(e) =>
                      handleItemChange(
                        idx,
                        "ITC",
                        null,
                        parseFloat(e.target.value)
                      )
                    }
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mt: 2, width: "100%" }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="CUIT/DNI"
                    name="cuit_dni"
                    value={formFactura.cuit_dni}
                    onChange={handleFormFacturaChange}
                    fullWidth
                    size="small"
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Razón Social"
                    name="razon_social"
                    value={formFactura.razon_social}
                    onChange={handleFormFacturaChange}
                    fullWidth
                    size="small"
                    required
                  />
                </Grid>
              </Grid>
            </Box>

            <TextField
              label="Detalle"
              name="detalle"
              value={formFactura.detalle}
              onChange={handleFormFacturaChange}
              fullWidth
              multiline
              size="small"
            />
            {/* Items */}
            <Typography variant="subtitle1" mt={2}>
              Alicuotas Facturas
            </Typography>

            {itemsAlicuota.map((item, idx) => (
              <Box
                key={idx}
                sx={{ border: "1px solid #ccc", borderRadius: 1, p: 2, mb: 2 }}
              >
                {/* Alicuotas IVA */}
                <Box sx={{ mt: 2, width: "100%" }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Tipo IVA</InputLabel>
                        <Select label="Tipo IVA" defaultValue="">
                          <MenuItem value="21">21%</MenuItem>
                          <MenuItem value="10.5">10.5%</MenuItem>
                          <MenuItem value="27">27%</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Neto Gravado"
                        type="number"
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="IVA"
                        type="number"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Button
                  size="small"
                  color="error"
                  onClick={() => removeItem(setItemsAlicuota, idx)}
                  sx={{ mt: 1 }}
                >
                  Quitar
                </Button>
              </Box>
            ))}

            <Button
              variant="outlined"
              onClick={() =>
                addItem(setItemsAlicuota, { tipo: "", netoGravado: 0, iva: 0 })
              }
              size="small"
            >
              Agregar Alicuota
            </Button>

            <Typography variant="subtitle1" mt={2}>
              Percepciones Facturas
            </Typography>
            {itemsPercepciones.map((item, idx) => (
              <Box
                key={idx}
                sx={{ border: "1px solid #ccc", borderRadius: 1, p: 2, mb: 2 }}
              >
                {/* Percepciones */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo Percepción</InputLabel>
                      <Select label="Tipo Percepción">
                        <MenuItem value="IVA">IVA</MenuItem>
                        <MenuItem value="IIBB">IIBB</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monto"
                      type="number"
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Button
                  size="small"
                  color="error"
                  onClick={() => removeItem(setItemsPercepciones, idx)}
                  sx={{ mt: 1 }}
                >
                  Quitar
                </Button>
              </Box>
            ))}

            <Button
              variant="outlined"
              onClick={() =>
                addItem(setItemsPercepciones, { tiposPercepcion: "", monto: 0 })
              }
              size="small"
            >
              Agregar Percepcion
            </Button>

            <Typography variant="subtitle1" mt={2}>
              Retenciones Facturas
            </Typography>
            {itemsRetenciones.map((item, idx) => (
              <Box
                key={idx}
                sx={{ border: "1px solid #ccc", borderRadius: 1, p: 2, mb: 2 }}
              >
                {/* Retenciones */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo Retención</InputLabel>
                      <Select label="Tipo Retención">
                        <MenuItem value="IVA">IVA</MenuItem>
                        <MenuItem value="IIBB">IIBB</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Monto"
                      type="number"
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Button
                  size="small"
                  color="error"
                  onClick={() => removeItem(setItemsRetenciones, idx)}
                  sx={{ mt: 1 }}
                >
                  Quitar
                </Button>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={() =>
                addItem(setItemsRetenciones, { tiposRetencion: "", monto: 0 })
              }
              size="small"
            >
              Agregar Retencion
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Facturacion;
