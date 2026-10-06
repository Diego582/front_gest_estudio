import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportLibroIVA = (
  cliente,
  facturas,
  resumen,
  mesPeriodo,
  anioPeriodo,
  tipoFactura,
  camposSeleccionados
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(num);
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

    return meses[Number(mes) - 1] || mes;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "-";

    if (typeof fecha === "string" && fecha.includes("-")) {
      const [anio, mes, dia] = fecha.split("T")[0].split("-");
      return `${dia}/${mes}/${anio}`;
    }

    if (typeof fecha === "string" && fecha.includes("/")) {
      return fecha;
    }

    const d = new Date(fecha);
    if (isNaN(d)) return "-";

    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const anio = d.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  const getTitulo = () => {
    const tipoTexto = tipoFactura === "emitida" ? "VENTAS" : "COMPRAS";
    return `LIBRO IVA ${tipoTexto} - ${getNombreMes(
      mesPeriodo
    )} ${anioPeriodo}`;
  };

  const drawHeader = () => {
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(getTitulo(), 14, 12);

    doc.setFontSize(8);
    doc.setFont(undefined, "normal");

    doc.text(`Cliente: ${cliente?.razon_social || "-"}`, 14, 19);
    doc.text(`CUIT: ${cliente?.cuit || "-"}`, 14, 24);
    doc.text(`Condición IVA: ${cliente?.condicion_iva || "-"}`, 75, 24);
    doc.text(`Periodo: ${getNombreMes(mesPeriodo)} ${anioPeriodo}`, 150, 24);

    doc.line(14, 28, 283, 28);
  };

  const calcularExtras = (facturas) => {
    const extras = {
      percepcionIVA: 0,
      percepcionIIBB: 0,
      percepcionGanancias: 0,
      retencionIVA: 0,
      retencionIIBB: 0,
      impuestosInternos: 0,
      ITC: 0,
      exento: 0,
      otrosTributos: 0,
    };

    facturas.forEach((f) => {
      f.items?.forEach((item) => {
        extras.impuestosInternos += Number(item.impuestosInternos || 0);
        extras.ITC += Number(item.ITC || 0);
        extras.exento += Number(item.excento || item.exento || 0);

        item.percepciones?.forEach((p) => {
          const tipo = String(p.tipo || "").toLowerCase();
          const monto = Number(p.monto || 0);

          if (tipo.includes("iva")) {
            extras.percepcionIVA += monto;
          } else if (
            tipo.includes("iibb") ||
            tipo.includes("ingresos brutos")
          ) {
            extras.percepcionIIBB += monto;
          } else if (tipo.includes("ganancia")) {
            extras.percepcionGanancias += monto;
          } else {
            extras.otrosTributos += monto;
          }
        });

        item.retenciones?.forEach((r) => {
          const tipo = String(r.tipo || "").toLowerCase();
          const monto = Number(r.monto || 0);

          if (tipo.includes("iva")) {
            extras.retencionIVA += monto;
          } else if (
            tipo.includes("iibb") ||
            tipo.includes("ingresos brutos")
          ) {
            extras.retencionIIBB += monto;
          }
        });
      });
    });

    return extras;
  };

  const facturasOrdenadas = [...facturas].sort((a, b) => {
    const fechaA = new Date(a.fecha);
    const fechaB = new Date(b.fecha);

    if (fechaA - fechaB !== 0) return fechaA - fechaB;

    if ((a.punto_venta || 0) - (b.punto_venta || 0) !== 0) {
      return (a.punto_venta || 0) - (b.punto_venta || 0);
    }

    return (a.numero || 0) - (b.numero || 0);
  });

  const extras = calcularExtras(facturasOrdenadas);

  const rows = facturasOrdenadas.map((f) => {
    let neto105 = 0;
    let iva105 = 0;
    let neto21 = 0;
    let iva21 = 0;
    let neto27 = 0;
    let iva27 = 0;
    let noGravado = 0;
    let exento = 0;
    let impuestosInternos = 0;
    let ITC = 0;
    let percepcionIVA = 0;
    let percepcionIIBB = 0;
    let percepcionGanancias = 0;
    let otrosTributos = 0;
    let retencionIVA = 0;
    let retencionIIBB = 0;

    f.items?.forEach((item) => {
      item.alicuotasIva?.forEach((a) => {
        const tipo = String(a.tipo || "")
          .replace("%", "")
          .trim()
          .replace(",", ".");

        if (tipo === "10.5") {
          neto105 += Number(a.netoGravado || 0);
          iva105 += Number(a.iva || 0);
        }

        if (tipo === "21") {
          neto21 += Number(a.netoGravado || 0);
          iva21 += Number(a.iva || 0);
        }

        if (tipo === "27") {
          neto27 += Number(a.netoGravado || 0);
          iva27 += Number(a.iva || 0);
        }
      });

      noGravado += Number(item.netoNoGravados || 0);
      exento += Number(item.excento || item.exento || 0);
      impuestosInternos += Number(item.impuestosInternos || 0);
      ITC += Number(item.ITC || 0);

      item.percepciones?.forEach((p) => {
        const tipo = String(p.tipo || "").toLowerCase();
        const monto = Number(p.monto || 0);

        if (tipo.includes("iva")) {
          percepcionIVA += monto;
        } else if (
          tipo.includes("iibb") ||
          tipo.includes("ingresos brutos")
        ) {
          percepcionIIBB += monto;
        } else if (tipo.includes("ganancia")) {
          percepcionGanancias += monto;
        } else {
          otrosTributos += monto;
        }
      });

      item.retenciones?.forEach((r) => {
        const tipo = String(r.tipo || "").toLowerCase();
        const monto = Number(r.monto || 0);

        if (tipo.includes("iva")) {
          retencionIVA += monto;
        } else if (
          tipo.includes("iibb") ||
          tipo.includes("ingresos brutos")
        ) {
          retencionIIBB += monto;
        }
      });
    });

    return [
      formatFecha(f.fecha),
      f.codigo_comprobante || "-",
      f.punto_venta || "-",
      f.numero || "-",
      f.cuit_dni || "-",
      f.razon_social || "-",
      f.detalle || "-",
      formatCurrency(neto105),
      formatCurrency(iva105),
      formatCurrency(neto21),
      formatCurrency(iva21),
      formatCurrency(neto27),
      formatCurrency(iva27),
      formatCurrency(noGravado),
      formatCurrency(exento),
      formatCurrency(impuestosInternos),
      formatCurrency(ITC),
      formatCurrency(percepcionIVA),
      formatCurrency(percepcionIIBB),
      formatCurrency(percepcionGanancias),
      formatCurrency(otrosTributos),
      formatCurrency(retencionIVA),
      formatCurrency(retencionIIBB),
      formatCurrency(f.monto_total),
    ];
  });

  const campos = [
    "fecha", "comprobante", "puntoVenta", "numero", "cuit", "razonSocial",
    "detalle", "neto105", "iva105", "neto21", "iva21", "neto27", "iva27",
    "noGravado", "exento", "impuestosInternos", "ITC", "percepcionIVA",
    "percepcionIIBB", "percepcionGanancias", "otrosTributos",
    "retencionIVA", "retencionIIBB", "total"
  ];

  const headers = [
    "Fecha", "Comp.", "PtoVta", "Número", "CUIT/DNI", "Razón Social",
    "Detalle", "Neto 10.5%", "IVA 10.5%", "Neto 21%", "IVA 21%",
    "Neto 27%", "IVA 27%", "No Gravado", "Exento", "Imp. Internos",
    "ITC", "Perc. IVA", "Perc. IIBB", "Perc. Ganancias", "Otros Tributos",
    "Total"
  ];

  const indices = (camposSeleccionados?.length ? camposSeleccionados : campos)
    .map((campo) => campos.indexOf(campo))
    .filter((index) => index >= 0);

  const headersSeleccionados = indices.map((index) => headers[index]);
  const rowsSeleccionadas = rows.map((row) =>
    indices.map((index) => row[index])
  );

  drawHeader();

  autoTable(doc, {
    startY: 32,
    head: [headersSeleccionados],
    body: rowsSeleccionadas,
    theme: "striped",

    margin: {
      top: 32,
      left: 5,
      right: 5,
      bottom: 15,
    },

    styles: {
      fontSize: 5.4,
      cellPadding: 0.7,
      overflow: "linebreak",
      valign: "middle",
    },

    headStyles: {
      fillColor: [70, 70, 70],
      textColor: 255,
      fontSize: 5.6,
      halign: "center",
      fontStyle: "bold",
    },

    tableWidth: "auto",
    columnStyles: Object.fromEntries(
      indices.map((_, index) => ({
        [index]: {
          halign: index >= 7 ? "right" : "left",
          cellWidth: "auto",
        },
      }))
    ),

    didDrawPage: () => {
      drawHeader();
    },
  });

  let finalY = doc.lastAutoTable.finalY + 8;

  if (finalY > 145) {
    doc.addPage();
    drawHeader();
    finalY = 35;
  }

  autoTable(doc, {
    startY: finalY,
    margin: { left: 178 },
    tableWidth: 105,
    head: [["Concepto", "Importe"]],
    body: [
      ["Neto Gravado 10.5%", formatCurrency(resumen.netoGravado105)],
      ["IVA 10.5%", formatCurrency(resumen.iva105)],
      ["Neto Gravado 21%", formatCurrency(resumen.netoGravado21)],
      ["IVA 21%", formatCurrency(resumen.iva21)],
      ["Neto Gravado 27%", formatCurrency(resumen.netoGravado27)],
      ["IVA 27%", formatCurrency(resumen.iva27)],
      ["No Gravado", formatCurrency(resumen.netoNoGravado)],

      ["Percepción IVA", formatCurrency(extras.percepcionIVA)],
      ["Percepción IIBB", formatCurrency(extras.percepcionIIBB)],
      ["Percepción Ganancias", formatCurrency(extras.percepcionGanancias)],
      ["Retenciones IVA", formatCurrency(extras.retencionIVA)],
      ["Retenciones IIBB", formatCurrency(extras.retencionIIBB)],
      ["Impuestos Internos", formatCurrency(extras.impuestosInternos)],
      ["ITC", formatCurrency(extras.ITC)],
      ["Exento", formatCurrency(extras.exento)],
      ["Otros Tributos", formatCurrency(extras.otrosTributos)],

      ["TOTAL", formatCurrency(resumen.montoTotal)],
    ],
    theme: "grid",

    styles: {
      fontSize: 8,
      cellPadding: 1.8,
    },

    headStyles: {
      fillColor: [80, 80, 80],
      textColor: 255,
      halign: "center",
      fontStyle: "bold",
    },

    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 43, halign: "right" },
    },

    didParseCell: (data) => {
      if (data.row.raw?.[0] === "TOTAL") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 10;
      }
    },
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(7);
    doc.setFont(undefined, "normal");

    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() - 32,
      doc.internal.pageSize.getHeight() - 7
    );
  }

  doc.save(
    `Libro_IVA_${
      tipoFactura === "emitida" ? "ventas" : "compras"
    }_${getNombreMes(mesPeriodo)}_${anioPeriodo}_${cliente?.cuit || ""}.pdf`
  );
};
