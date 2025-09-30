import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportLibroIVA = (cliente, facturas, resumen) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Encabezado
  doc.setFontSize(14);
  doc.text("Libro IVA", 14, 20);
  doc.setFontSize(10);
  doc.text(`Cliente: ${cliente?.razon_social || "-"}`, 14, 30);
  doc.text(`CUIT: ${cliente?.cuit || "-"}`, 14, 36);

  // Cuerpo de facturas
  const rows = facturas.map((f) => {
    let neto105 = 0,
      iva105 = 0,
      neto21 = 0,
      iva21 = 0,
      neto27 = 0,
      iva27 = 0;
    f.items?.forEach((item) => {
      item.alicuotasIva?.forEach((a) => {
        const tipo = a.tipo.replace("%", "").trim();
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
      neto105.toFixed(2),
      iva105.toFixed(2),
      neto21.toFixed(2),
      iva21.toFixed(2),
      neto27.toFixed(2),
      iva27.toFixed(2),
      f.items?.reduce((acc, i) => acc + (i.netoNoGravados || 0), 0).toFixed(2),
      f.monto_total?.toFixed(2),
    ];
  });

  // Totales en el footer
  const foot = [
    [
      "Totales",
      "",
      "",
      "",
      "",
      "",
      resumen.netoGravado105.toFixed(2),
      resumen.iva105.toFixed(2),
      resumen.netoGravado21.toFixed(2),
      resumen.iva21.toFixed(2),
      resumen.netoGravado27.toFixed(2),
      resumen.iva27.toFixed(2),
      resumen.netoNoGravado.toFixed(2),
      resumen.montoTotal.toFixed(2),
    ],
  ];

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
    foot: foot, // 👈 Totales alineados con las mismas columnas
    styles: { fontSize: 8 },
    headStyles: { fillColor: [200, 200, 200] },
    footStyles: { fillColor: [230, 230, 230], fontStyle: "bold" },
  });

  doc.save("libro_iva.pdf");
};
