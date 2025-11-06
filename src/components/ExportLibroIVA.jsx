import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportLibroIVA = (
  cliente,
  facturas,
  resumen,
  mesPeriodo,
  anioPeriodo,
  tipoFactura
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // === FORMATEADOR DE MONEDA (pesos argentinos) ===
  const formatCurrency = (value) => {
    if (isNaN(value)) return "-";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // === ENCABEZADO PRINCIPAL ===
  doc.setFontSize(16);
  doc.text(
    `LIBRO IVA - ${
      tipoFactura === "emitida"
        ? "Ventas - " + mesPeriodo + " del año " + anioPeriodo
        : "Compras - " + mesPeriodo + " del año " + anioPeriodo
    }`,
    14,
    15
  );
  doc.setFontSize(10);
  doc.text(`Cliente: ${cliente?.razon_social || "-"}`, 14, 25);
  doc.text(`CUIT: ${cliente?.cuit || "-"}`, 14, 31);

  // === CUERPO PRINCIPAL ===
  const rows = facturas.map((f) => {
    let neto105 = 0,
      iva105 = 0,
      neto21 = 0,
      iva21 = 0,
      neto27 = 0,
      iva27 = 0;

    f.items?.forEach((item) => {
      item.alicuotasIva?.forEach((a) => {
        const tipo = a.tipo.replace("%", "").trim().replace(",", ".");
        if (tipo === "10.5") {
          neto105 += a.netoGravado || 0;
          iva105 += a.iva || 0;
        }
        if (tipo === "21") {
          neto21 += a.netoGravado || 0;
          iva21 += a.iva || 0;
        }
        if (tipo === "27") {
          neto27 += a.netoGravado || 0;
          iva27 += a.iva || 0;
        }
      });
    });

    return [
      new Date(f.fecha).toLocaleDateString(),
      f.codigo_comprobante,
      f.punto_venta,
      f.numero,
      f.cuit_dni,
      f.razon_social,
      f.detalle,
      formatCurrency(neto105),
      formatCurrency(iva105),
      formatCurrency(neto21),
      formatCurrency(iva21),
      formatCurrency(neto27),
      formatCurrency(iva27),
      formatCurrency(
        f.items?.reduce((acc, i) => acc + (i.netoNoGravados || 0), 0)
      ),
      formatCurrency(f.monto_total),
    ];
  });

  // === TABLA PRINCIPAL ===
  autoTable(doc, {
    startY: 45,
    head: [
      [
        "Fecha",
        "Comp.",
        "PtoVta",
        "Número",
        "CUIT/DNI",
        "Razón Social",
        "Detalle",
        "Neto 10.5%",
        "IVA 10.5%",
        "Neto 21%",
        "IVA 21%",
        "Neto 27%",
        "IVA 27%",
        "No Gravado",
        "Total",
      ],
    ],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [200, 200, 200] },
    theme: "striped",
    margin: { bottom: 20 },
  });

  // === TOTALES SOLO AL FINAL ===
  const finalY = doc.lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: finalY,
    body: [
      [
        "Totales",
        "",
        "",
        "",
        "",
        "",
        formatCurrency(resumen.netoGravado105),
        formatCurrency(resumen.iva105),
        formatCurrency(resumen.netoGravado21),
        formatCurrency(resumen.iva21),
        formatCurrency(resumen.netoGravado27),
        formatCurrency(resumen.iva27),
        formatCurrency(resumen.netoNoGravado),
        formatCurrency(resumen.montoTotal),
      ],
    ],
    styles: { fontSize: 9, fontStyle: "bold" },
    theme: "plain",
    columnStyles: {
      0: { fontStyle: "bold", halign: "left" },
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "right" },
      10: { halign: "right" },
      11: { halign: "right" },
      12: { halign: "right" },
      13: { halign: "right" },
    },
  });

  // === PIE DE PÁGINA CON NUMERACIÓN ===
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() - 30,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // === NOMBRE DEL ARCHIVO ===
  doc.save(
    `Libro_IVA_${
      tipoFactura === "emitida"
        ? `ventas_${mesPeriodo}_${anioPeriodo}_${cliente.cuit}`
        : `compras_${mesPeriodo}_${anioPeriodo}_${cliente.cuit}`
    }.pdf`
  );
};
