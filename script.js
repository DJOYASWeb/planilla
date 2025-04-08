let workbookGlobal;

document.getElementById('upload').addEventListener('change', handleFile, false);
document.getElementById('download').addEventListener('click', downloadFile);

function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    // Tomar primera hoja
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];

    // Convertir a JSON
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Mostrar en pantalla
    document.getElementById('output').textContent = JSON.stringify(json, null, 2);

    workbookGlobal = workbook;
    document.getElementById('download').disabled = false;
  };

  reader.readAsArrayBuffer(file);
}

function downloadFile() {
  if (!workbookGlobal) return;

  const wbout = XLSX.write(workbookGlobal, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'productos_procesados.xlsx';
  link.click();
}

