// Conciliación de solo lectura. Los importes históricos conservan su signo.
const centavos = (valor) => {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? Math.sign(n) * Math.round(Math.abs(n) * 100 + 1e-8) : 0;
};
const pesos = (n) => n / 100;
const lista = (v) => Array.isArray(v) ? v : [];
const tasas = {"0":"0","2.5":"25","5":"5","10.5":"105","21":"21","27":"27"};
export function conciliarFactura(f) {
  const c = { montoTotal: centavos(f.monto_total), netoNoGravado: 0, exento: 0,
    impuestosInternos: 0, ITC: 0, percepciones: 0, retenciones: 0,
    netoGravado: 0, iva: 0 };
  for (const t of Object.values(tasas)) {
    c["netoGravado"+t] = 0; c["iva"+t] = 0;
  }
  for (const item of lista(f.items)) {
    c.netoNoGravado += centavos(item.netoNoGravados);
    c.exento += centavos(item.excento ?? item.exento);
    c.impuestosInternos += centavos(item.impuestosInternos);
    c.ITC += centavos(item.ITC);
    for (const a of lista(item.alicuotasIva)) {
      const neto = centavos(a.netoGravado), iva = centavos(a.iva);
      c.netoGravado += neto; c.iva += iva;
      const tasa = tasas[String(a.tipo ?? "").replace("%","").trim().replace(",",".")];
      if (tasa !== undefined) { c["netoGravado"+tasa] += neto; c["iva"+tasa] += iva; }
    }
    for (const p of lista(item.percepciones)) c.percepciones += centavos(p.monto);
    // Retenciones: se informan aparte, no integran el total facturado.
    for (const r of lista(item.retenciones)) c.retenciones += centavos(r.monto);
  }
  c.montoDesdeItems = c.netoGravado + c.iva + c.netoNoGravado + c.exento +
    c.impuestosInternos + c.ITC + c.percepciones;
  c.diferencia = c.montoTotal - c.montoDesdeItems;
  return {...Object.fromEntries(Object.entries(c).map(([k,v])=>[k,pesos(v)])),
    clasificacion: f.tipo === "recibida" ? (f.esGasto === true ? "Gastos" : "Compras") : "Ventas",
    conciliado: lista(f.items).length > 0 && c.diferencia === 0};
}
export function resumirFacturas(facturas) {
  const base = conciliarFactura({});
  const sumas = Object.fromEntries(Object.keys(base).filter(k=>typeof base[k]==="number").map(k=>[k,0]));
  let pendientes=0, diferenciaAbsoluta=0, notasCredito=0, notasDebito=0;
  for (const f of facturas) {
    const c = conciliarFactura(f);
    for (const k of Object.keys(sumas)) sumas[k] += centavos(c[k]);
    if (!c.conciliado) pendientes++;
    diferenciaAbsoluta += Math.abs(centavos(c.diferencia));
    const tipo = String(f.tipo_comprobante ?? f.codigo_comprobante ?? "");
    if (/\bNC\b|nota de cr[eé]dito/i.test(tipo)) notasCredito += centavos(c.montoTotal);
    if (/\bND\b|nota de d[eé]bito/i.test(tipo)) notasDebito += centavos(c.montoTotal);
  }
  return {...Object.fromEntries(Object.entries(sumas).map(([k,v])=>[k,pesos(v)])),
    totalFacturas: facturas.length, pendientes, diferenciaAbsoluta: pesos(diferenciaAbsoluta),
    notasCredito: pesos(notasCredito), notasDebito: pesos(notasDebito)};
}
