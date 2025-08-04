import * as XLSX from 'xlsx';
import { useDispatch } from 'react-redux';
import facturaActions from '../store/actions/facturas'; // Ajustá la ruta según tu estructura

export default function FacturaImport() {
  const dispatch = useDispatch();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    dispatch(facturaActions.bulkCreateFacturas(json));
  };

  return <input type="file" accept=".xlsx, .csv" onChange={handleFile} />;
}
