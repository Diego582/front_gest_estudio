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
      retenciones: 0,
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
          extras.retenciones += Number(r.monto || 0);
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
    let percepcionIVA = 0;

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

      item.percepciones?.forEach((p) => {
        const tipo = String(p.tipo || "").toLowerCase();

        if (tipo.includes("iva")) {
          percepcionIVA += Number(p.monto || 0);
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
      formatCurrency(percepcionIVA),
      formatCurrency(f.monto_total),
    ];
  });

  drawHeader();

  autoTable(doc, {
    startY: 32,
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
        "Perc. IVA",
        "Total",
      ],
    ],
    body: rows,
    theme: "striped",

    margin: {
      top: 32,
      left: 5,
      right: 5,
      bottom: 15,
    },

    styles: {
      fontSize: 6.2,
      cellPadding: 0.8,
      overflow: "linebreak",
      valign: "middle",
    },

    headStyles: {
      fillColor: [70, 70, 70],
      textColor: 255,
      fontSize: 6.4,
      halign: "center",
      fontStyle: "bold",
    },

    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 22 },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 15, halign: "right" },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 30 },
      6: { cellWidth: 12 },
      7: { cellWidth: 17, halign: "right" },
      8: { cellWidth: 17, halign: "right" },
      9: { cellWidth: 17, halign: "right" },
      10: { cellWidth: 17, halign: "right" },
      11: { cellWidth: 17, halign: "right" },
      12: { cellWidth: 17, halign: "right" },
      13: { cellWidth: 17, halign: "right" },
      14: { cellWidth: 17, halign: "right" },
      15: { cellWidth: 20, halign: "right" },
    },

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
      ["Retenciones", formatCurrency(extras.retenciones)],
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
