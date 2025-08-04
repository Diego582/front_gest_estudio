import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TextField,
  MenuItem,
  Button,
  Grid,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";

const tipos = ["emitida", "recibida"];

export default function FacturaForm() {
  const dispatch = useDispatch();
  const clientes = useSelector((state) => state.clientes.clientes);

  const [form, setForm] = useState({
    cliente_id: "",
    fecha: "",
    tipo: "emitida",
    codigo_comprobante: "",
    punto_venta: "",
    numero: "",
    cuit_dni: "",
    razon_social: "",
    detalle: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    dispatch(createFactura(form));
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Cliente</InputLabel>
          <Select
            name="cliente_id"
            value={form.cliente_id}
            label="Cliente"
            onChange={handleChange}
          >
            {clientes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.razon_social} ({c.cuit})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField name="fecha" type="date" fullWidth onChange={handleChange} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <Select name="tipo" value={form.tipo} fullWidth onChange={handleChange}>
          {tipos.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      {/* Otros campos: comprobante, punto_venta, numero, etc. */}
      <Grid item xs={12}>
        <Button variant="contained" onClick={handleSubmit}>
          Guardar Factura
        </Button>
      </Grid>
    </Grid>
  );
}
