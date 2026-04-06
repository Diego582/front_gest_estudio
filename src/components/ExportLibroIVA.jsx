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

  const getNombreMes = (mes) => {
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
    return meses[mes - 1] || mes;
  };

  // === FORMATEADOR DE FECHA (SIN PROBLEMA DE ZONA HORARIA) ===
  const formatFecha = (fecha) => {
    if (!fecha) return "-";

    // 🟢 Caso 1: formato ISO (YYYY-MM-DD o con T)
    if (typeof fecha === "string" && fecha.includes("-")) {
      const [anio, mes, dia] = fecha.split("T")[0].split("-");
      return `${dia}/${mes}/${anio}`;
    }

    // 🟢 Caso 2: ya viene en formato DD/MM/YYYY
    if (typeof fecha === "string" && fecha.includes("/")) {
      return fecha;
    }

    // 🟢 Caso 3: fallback (Date)
    const d = new Date(fecha);
    if (isNaN(d)) return "-";

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  // === ENCABEZADO PRINCIPAL ===
  doc.setFontSize(16);
  doc.text(
    `LIBRO IVA - ${
      tipoFactura === "emitida"
        ? "Ventas - " + getNombreMes(mesPeriodo) + "  del año " + anioPeriodo
        : "Compras - " + getNombreMes(mesPeriodo) + " del año " + anioPeriodo
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
      formatFecha(f.fecha), // ✅ FIX FECHA
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

  // === RESUMEN EN 2 COLUMNAS (NUEVO) ===
  const finalY = doc.lastAutoTable.finalY + 10;

  // Ancho de la página
  const pageWidth = doc.internal.pageSize.getWidth();

  // Ancho reducido del resumen
  const tableWidth = 80;

  // Posición a la derecha
  const startX = pageWidth - tableWidth - 14;

  autoTable(doc, {
    startY: finalY,
    startX: startX,
    tableWidth: tableWidth,

    head: [["Concepto", "Importe"]],
    body: [
      ["Neto Gravado 10.5%", formatCurrency(resumen.netoGravado105)],
      ["IVA 10.5%", formatCurrency(resumen.iva105)],
      ["Neto Gravado 21%", formatCurrency(resumen.netoGravado21)],
      ["IVA 21%", formatCurrency(resumen.iva21)],
      ["Neto Gravado 27%", formatCurrency(resumen.netoGravado27)],
      ["IVA 27%", formatCurrency(resumen.iva27)],
      ["No Gravado", formatCurrency(resumen.netoNoGravado)],
      ["TOTAL", formatCurrency(resumen.montoTotal)],
    ],

    styles: {
      fontSize: 9,
      cellPadding: 2,
    },

    headStyles: {
      fillColor: [160, 160, 160],
      textColor: 0,
      halign: "center",
    },

    columnStyles: {
      0: { halign: "left", cellWidth: 50 },
      1: { halign: "right", cellWidth: 50 },
    },

    theme: "grid",

    // 🔥 ESTILO PRO: destacar TOTAL
    didParseCell: function (data) {
      if (data.row.index === 7) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 11;
      }
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
