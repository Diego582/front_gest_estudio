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
  Collapse,
  Grid,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFacturas,
  uploadFacturasExcel,
  uploadFacturasTxt,
  updateFactura,
} from "../store/actions/facturas";
import { fetchClientes } from "../store/actions/clientes";
import { createItemFactura } from "../store/actions/itemsFacturas";
import { Add, UploadFile } from "@mui/icons-material";
import { tiposComprobantes } from "../utils/tipoComprobantes";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { exportLibroIVA } from "../components/ExportLibroIVA";

const Facturacion = () => {
  const tiposIVA = [21, 10.5, 27];
  const tiposPercepcion = ["IVA", "IIBB"];
  const tiposRetencion = ["IVA", "IIBB"];

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const hoy = new Date().getFullYear();

  const dispatch = useDispatch();
  const [search, setSearch] = useState("");

  // Redux state
  const { facturas, loading, error, messages } = useSelector(
    (state) => state.factura
  );
  const clientes = useSelector((state) => state.clientes.clientes);
  console.log(loading, "loading");
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

  const [mesPeriodo, setMesPeriodo] = useState(meses[new Date().getMonth()]);
  const [anioPeriodo, setAnioPeriodo] = useState(hoy);

  // Agrupación por fecha (simplificada)

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [openRows, setOpenRows] = useState({});

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFacturaId, setSelectedFacturaId] = useState(null);

  const [editSection, setEditSection] = useState(null);

  const toggleRow = (id) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFacturas = facturas
    .filter((f) => f.tipo === tipoFactura)
    .filter((f) => {
      if (!fechaInicio && !fechaFin) return true;

      const fechaFactura = new Date(f.fecha).toLocaleDateString("sv-SE", {
        timeZone: "UTC",
      }); // YYYY-MM-DD

      if (fechaInicio && fechaFin) {
        return fechaFactura >= fechaInicio && fechaFactura <= fechaFin;
      }
      if (fechaInicio) return fechaFactura >= fechaInicio;
      if (fechaFin) return fechaFactura <= fechaFin;
      return true;
    })
    .filter((f) => {
      if (mesPeriodo === "Todos" || !mesPeriodo) return true;
      // Convertir nombre de mes (ej. "Agosto") a número de 2 dígitos
      const mesIndex = meses.indexOf(mesPeriodo) + 1;
      const mesFormateado = mesIndex.toString().padStart(2, "0");

      // Extraer los datos del período de la factura
      const mesFactura = f.periodo?.mes;
      const anioFactura = f.periodo?.anio;

      // Comparar mes y año
      return (
        mesFactura === mesFormateado && anioFactura === Number(anioPeriodo)
      );
    });

  // Inicializamos los totales
  // Resumen actualizado
  const resumen = {
    totalFacturas: filteredFacturas.length,
    montoTotal: 0, // suma de monto_total de facturas
    montoDesdeItems: 0, // suma calculada desde items
    diferencia: 0, // nuevo campo
    notasCredito: 0,
    notasDebito: 0,
    iva105: 0,
    iva21: 0,
    iva27: 0,
    netoGravado105: 0,
    netoGravado21: 0,
    netoGravado27: 0,
    netoNoGravado: 0,
  };

  filteredFacturas.forEach((f) => {
    const montoFactura = f.monto_total || 0;
    resumen.montoTotal += montoFactura;

    if (f.tipo_comprobante === "NC") resumen.notasCredito += montoFactura;
    if (f.tipo_comprobante === "ND") resumen.notasDebito += montoFactura;

    let totalItemsFactura = 0;
    f.items?.forEach((item) => {
      const netoNoGravado = item.netoNoGravados || 0;
      const impuestosInternos = item.impuestosInternos || 0;
      const ITC = item.ITC || 0;

      const totalAlicuotas =
        item.alicuotasIva?.reduce(
          (acc, a) => acc + ((a.netoGravado || 0) + (a.iva || 0)),
          0
        ) || 0;

      totalItemsFactura +=
        totalAlicuotas + netoNoGravado + impuestosInternos + ITC;

      // Suma discriminada de IVA y neto gravado
      item.alicuotasIva?.forEach((ali) => {
        const tipoNormalized = ali.tipo
          .replace("%", "")
          .trim()
          .replace(",", ".");
        const neto = ali.netoGravado || 0;
        const iva = ali.iva || 0;
        if (tipoNormalized === "10.5") {
          resumen.iva105 += iva;
          resumen.netoGravado105 += neto;
        }
        if (tipoNormalized === "21") {
          resumen.iva21 += iva;
          resumen.netoGravado21 += neto;
        }
        if (tipoNormalized === "27") {
          resumen.iva27 += iva;
          resumen.netoGravado27 += neto;
        }
      });

      resumen.netoNoGravado += netoNoGravado;
    });

    resumen.montoDesdeItems += totalItemsFactura;
  });

  // Calculamos la diferencia
  resumen.diferencia = resumen.montoTotal - resumen.montoDesdeItems;

  console.log(filteredFacturas, "filteredFacturas");

  // Carga clientes al montar
  useEffect(() => {
    dispatch(fetchClientes(search ? { search } : {}));
  }, [dispatch]);

  // Carga facturas cuando cambia cliente o tipo
  useEffect(() => {
    if (clienteId) {
      dispatch(fetchFacturas({ clienteId }));
    }
  }, [clienteId, dispatch]);

  // Handlers para filtros
  const handleClienteChange = (e) => {
    setClienteId(e.target.value);
    setFormFactura((prev) => ({
      ...prev,
      cliente_id: e.target.value,
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

  const handleEditFactura = (factura) => {
    setIsEditMode(true);
    setEditSection("detalle");
    setSelectedFacturaId(factura._id);

    setFormFactura({
      cliente_id: factura.cliente_id?._id || factura.cliente_id,
      fecha: factura.fecha?.substring(0, 10) || "",
      detalle: factura.detalle || "",
      tipo: factura.tipo || "emitida",
      codigo_comprobante: factura.codigo_comprobante || "",
      punto_venta: factura.punto_venta || "",
      numero: factura.numero || "",
      cuit_dni: factura.cuit_dni || "",
      razon_social: factura.razon_social || "",
    });

    setItemsAlicuota(
      factura.items?.flatMap((i) => i.alicuotasIva || []) || [
        { tipo: "", netoGravado: 0, iva: 0 },
      ]
    );

    setOpenForm(true);
  };
  const handleDeleteFactura = (f) => {};
  const handleEdit = () => {
    if (!selectedFacturaId) return;
    if (!formFactura) return;

    dispatch(
      updateFactura({
        id: selectedFacturaId,
        facturaData: { detalle: formFactura.detalle },
      })
    )
      .unwrap()
      .then((updatedFactura) => {
        // Cerrar el modal
        setOpenForm(false);

        // Opcional: resetear el formulario
        setFormFactura({ detalle: "" });
        setSelectedFacturaId(null);
      })
      .catch((error) => {
        console.error("Error al actualizar factura:", error);
        // Opcional: mostrar alerta de error
      });
  };
  const handleCreate = () => {};

  // Importar Excel o CSV
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) {
    } // Si no seleccionó archivo, no hace nada

    // Solo disparo la acción redux que ya maneja los Swal
    dispatch(
      uploadFacturasExcel({
        file: file,
        clienteId: clienteId,
        periodo: {
          mes: mesPeriodo,
          anio: Number(anioPeriodo),
        },
      })
    );
  };
  const handleCreateFactura = () => {
    setIsEditMode(false);
    setOpenForm(true);
  };

  // Importar TXT (VENTAS + ALICUOTAS)
  const handleImportTxt = (e) => {
    const files = e.target.files;
    if (!files || files.length < 2) {
      Swal.fire({
        icon: "warning",
        title: "Archivos faltantes",
        text: "Debes seleccionar los archivos VENTAS.txt y ALICUOTAS.txt",
      });
      return;
    }

    // Buscar cuál es cada uno
    const ventasFile = Array.from(files).find((f) =>
      f.name.toUpperCase().includes("VENTAS")
    );
    const alicuotasFile = Array.from(files).find((f) =>
      f.name.toUpperCase().includes("ALICUOTAS")
    );

    if (!ventasFile || !alicuotasFile) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontraron los archivos VENTAS.txt y ALICUOTAS.txt",
      });
      return;
    }

    dispatch(uploadFacturasTxt({ ventasFile, alicuotasFile, clienteId }));
  };

  console.log(clientes, "esto es clientes");
  return (
    <Container
      maxWidth="lg"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: `calc(100vh - 64px)`, // altura total menos header
        py: 1,
      }}
    >
      <Grid container spacing={2} alignItems="center" mb={2}>
        {/* Cliente */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="cliente-select-label">Cliente</InputLabel>
            <Select
              labelId="cliente-select-label"
              value={clienteId}
              label="Cliente"
              onChange={handleClienteChange}
            >
              {clientes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.razon_social}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Periodo: Mes y Año */}
        <Grid item xs={12} sm={6} md={3}>
          <Box display="flex" gap={1}>
            <FormControl fullWidth size="small">
              <InputLabel id="mes-select-label">Mes</InputLabel>
              <Select
                labelId="mes-select-label"
                value={mesPeriodo}
                label="Mes"
                onChange={(e) => setMesPeriodo(e.target.value)}
              >
                <MenuItem value="Todos">Todos</MenuItem>
                {meses.map((mes) => (
                  <MenuItem key={mes} value={mes}>
                    {mes}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Año"
              type="number"
              size="small"
              value={anioPeriodo}
              onChange={(e) => setAnioPeriodo(e.target.value)}
              fullWidth
            />
          </Box>
        </Grid>

        {/* Fechas */}
        <Grid item xs={12} sm={6} md={4}>
          <Box display="flex" gap={1}>
            <TextField
              label="Fecha Inicio"
              type="date"
              size="small"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fecha Fin"
              type="date"
              size="small"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button
              variant="outlined"
              onClick={() => {
                setFechaInicio("");
                setFechaFin("");
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Grid>

        {/* Switch Tipo */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl>
            <Typography
              component="div"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Compras
              <Switch
                checked={tipoFactura === "emitida"}
                onChange={(e) =>
                  setTipoFactura(e.target.checked ? "emitida" : "recibida")
                }
                color="primary"
              />
              Ventas
            </Typography>
          </FormControl>
        </Grid>

        {/* Botones */}
        <Grid item xs={12} sm={6} md={3} display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleCreateFactura()}
            disabled={!clienteId}
            fullWidth
          >
            Nueva Factura
          </Button>

          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFile />}
            disabled={!clienteId}
            fullWidth
          >
            Importar
            <input
              type="file"
              accept=".xlsx, .csv"
              hidden
              onChange={handleImport}
            />
          </Button>

          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFile />}
            disabled={!clienteId}
            fullWidth
          >
            Importar TXT
            <input
              type="file"
              accept=".txt"
              multiple
              hidden
              onChange={handleImportTxt}
            />
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() =>
              exportLibroIVA(
                clientes.find((c) => c._id === clienteId),
                filteredFacturas,
                resumen
              )
            }
          >
            Exportar Libro IVA (PDF)
          </Button>
        </Grid>
      </Grid>

      {/* Tabla Facturas agrupadas por fecha */}
      {filteredFacturas.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            mt: 8,
            p: 4,
            border: "2px dashed #90caf9",
            borderRadius: 4,
            backgroundColor: "#e3f2fd",
            color: "#1565c0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            animation: "fadeIn 0.8s ease-in-out",
          }}
        >
          <ReceiptLongIcon sx={{ fontSize: 80 }} />
          <Typography variant="h5" fontWeight="bold">
            ¡Oops!
          </Typography>
          <Typography variant="body1">
            No hay facturas para mostrar <br />o los filtros aplicados no
            coinciden con ningún resultado.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Intenta quitar o modificar los filtros para ver resultados.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ flex: 1, minHeight: 0, mb: 2 }}>
            <Paper
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell /> {/* Para el icono */}
                      <TableCell align="center">Fecha</TableCell>
                      <TableCell align="left">Código Comprobante</TableCell>
                      <TableCell align="center">Punto de Venta</TableCell>
                      <TableCell align="center">Número</TableCell>
                      <TableCell align="left">Detalle</TableCell>
                      <TableCell align="center">CUIT/DNI</TableCell>
                      <TableCell align="left">Razón Social</TableCell>
                      <TableCell align="right">Importe Total</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredFacturas.map((f) => (
                      <React.Fragment key={f._id}>
                        {/* Fila principal */}
                        <TableRow
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: "#f9f9f9",
                            },
                          }}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleRow(f._id)}
                            >
                              {openRows[f._id] ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                          </TableCell>

                          <TableCell align="center">
                            {new Date(f.fecha).toLocaleDateString("es-AR", {
                              timeZone: "UTC",
                            })}
                          </TableCell>
                          <TableCell align="left">
                            {f.codigo_comprobante}
                          </TableCell>
                          <TableCell align="center">{f.punto_venta}</TableCell>
                          <TableCell align="center">{f.numero}</TableCell>
                          <TableCell align="left">{f.detalle}</TableCell>
                          <TableCell align="center">{f.cuit_dni}</TableCell>
                          <TableCell align="left">{f.razon_social}</TableCell>
                          <TableCell align="right">
                            {f.monto_total?.toLocaleString("es-AR", {
                              style: "currency",
                              currency: "ARS",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <IconButton
                                color="primary"
                                onClick={() => handleEditFactura(f)}
                              >
                                <EditNoteIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteFactura(f)}
                              >
                                <DeleteForeverIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {/* Collapse con items */}
                        <TableRow>
                          <TableCell
                            style={{ paddingBottom: 0, paddingTop: 0 }}
                            colSpan={10}
                          >
                            <Collapse
                              in={openRows[f._id]}
                              timeout="auto"
                              unmountOnExit
                            >
                              <Box margin={1}>
                                {f.items?.map((item, idx) => (
                                  <Box
                                    key={idx}
                                    mb={1}
                                    sx={{
                                      borderBottom: "1px solid #eee",
                                      pb: 1,
                                    }}
                                  >
                                    <strong>{item.descripcion}</strong>
                                    <div>
                                      Neto Gravado:{" "}
                                      {item.alicuotasIva
                                        ?.reduce(
                                          (acc, a) =>
                                            acc + (a.netoGravado || 0),
                                          0
                                        )
                                        .toLocaleString("es-AR", {
                                          style: "currency",
                                          currency: "ARS",
                                        })}
                                    </div>
                                    <div>
                                      IVA:{" "}
                                      {item.alicuotasIva
                                        ?.reduce(
                                          (acc, a) => acc + (a.iva || 0),
                                          0
                                        )
                                        .toLocaleString("es-AR", {
                                          style: "currency",
                                          currency: "ARS",
                                        })}
                                    </div>
                                    <div>
                                      Neto No Gravado:{" "}
                                      {(
                                        item.netoNoGravados || 0
                                      ).toLocaleString("es-AR", {
                                        style: "currency",
                                        currency: "ARS",
                                      })}
                                    </div>
                                  </Box>
                                ))}

                                {/* Suma total de los items */}
                                <Box
                                  mt={1}
                                  p={1}
                                  sx={{
                                    borderTop: "2px solid #ccc",
                                    fontWeight: "bold",
                                    backgroundColor: "#f5f5f5",
                                  }}
                                >
                                  <div>
                                    Suma del Item:{" "}
                                    {f.items
                                      ?.reduce(
                                        (acc, item) =>
                                          acc +
                                          (item.netoNoGravados || 0) +
                                          (item.alicuotasIva?.reduce(
                                            (subAcc, a) =>
                                              subAcc +
                                              (a.netoGravado || 0) +
                                              (a.iva || 0),
                                            0
                                          ) || 0),
                                        0
                                      )
                                      .toLocaleString("es-AR", {
                                        style: "currency",
                                        currency: "ARS",
                                      })}
                                  </div>
                                </Box>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Footer fijo */}
          {/* Footer fijo abajo */}
          <Paper
            elevation={3}
            sx={{
              flexShrink: 0,
              p: 1,
              borderTop: "1px solid #ddd",
              backgroundColor: "#fafafa",
            }}
          >
            <Grid container spacing={1} alignItems="center">
              {/* Totales generales */}
              <Grid item xs={6} sm={1} sx={{ textAlign: "center" }}>
                <Typography variant="caption">Total Item</Typography>
                <Typography variant="body1">{resumen.totalFacturas}</Typography>
              </Grid>
              <Grid item xs={6} sm={2} sx={{ textAlign: "center" }}>
                <Typography variant="caption">Monto Total</Typography>
                <Typography variant="body1">
                  {resumen.montoTotal?.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>

              {/* Neto Gravado + IVA por alícuota */}
              {["105", "21", "27"].map((ali) => (
                <Grid item xs={6} sm={3} key={ali} sx={{ textAlign: "center" }}>
                  <Typography variant="caption">
                    Neto {ali}% / IVA {ali}%
                  </Typography>
                  <Typography variant="body1">
                    {resumen[`netoGravado${ali}`]?.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}{" "}
                    /{" "}
                    {resumen[`iva${ali}`]?.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </Typography>
                </Grid>
              ))}

              {/* Neto No Gravado */}
              <Grid item xs={6} sm={2} sx={{ textAlign: "center" }}>
                <Typography variant="caption">Neto No Gravado</Typography>
                <Typography variant="body1">
                  {resumen.netoNoGravado?.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </Typography>
              </Grid>

              {/* Comparación Factura vs Items */}
              <Grid item xs={6} sm={2} sx={{ textAlign: "center" }}>
                <Typography variant="caption">Monto Items</Typography>
                <Typography variant="body1" color="secondary">
                  {resumen.montoDesdeItems?.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2} sx={{ textAlign: "center" }}>
                <Typography variant="caption">Diferencia</Typography>
                <Typography
                  variant="body1"
                  color={resumen.diferencia !== 0 ? "error" : "textPrimary"}
                >
                  {resumen.diferencia?.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
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
                      disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
                    fullWidth
                    size="small"
                    required
                  >
                    {tiposComprobantes.map((comp) => (
                      <MenuItem key={comp.codigo} value={comp.codigo}>
                        {comp.codigo}
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
                    disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
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
                    disabled={isEditMode && editSection === "detalle"}
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
            {!isEditMode && (
              <>
                <Typography variant="subtitle1" mt={2}>
                  Alicuotas Facturas
                </Typography>

                {itemsAlicuota.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                    }}
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
                    addItem(setItemsAlicuota, {
                      tipo: "",
                      netoGravado: 0,
                      iva: 0,
                    })
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
                    disabled={isEditMode && editSection === "detalle"}
                    key={idx}
                    sx={{
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                    }}
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
                    addItem(setItemsPercepciones, {
                      tiposPercepcion: "",
                      monto: 0,
                    })
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
                    sx={{
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                    }}
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
                    addItem(setItemsRetenciones, {
                      tiposRetencion: "",
                      monto: 0,
                    })
                  }
                  size="small"
                >
                  Agregar Retencion
                </Button>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
          {isEditMode ? (
            <Button onClick={handleEdit}>Editar</Button>
          ) : (
            <Button onClick={handleSubmit}>Guardar</Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Facturacion;
