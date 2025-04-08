let apiKey = "";

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("upload");
  const downloadBtn = document.getElementById("download");
  const apiKeyInput = document.getElementById("apikey");
  const output = document.getElementById("output");

  let products = [];

  apiKeyInput.addEventListener("change", (e) => {
    apiKey = e.target.value;
  });

  fileInput.addEventListener("change", handleFile);
  downloadBtn.addEventListener("click", generateAndDownload);

  function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      products = XLSX.utils.sheet_to_json(worksheet);
      output.textContent = "Archivo cargado: " + products.length + " productos.";
      downloadBtn.disabled = false;
    };

    reader.readAsArrayBuffer(file);
  }

  async function generateAndDownload() {
    if (!apiKey || products.length === 0) return alert("Falta la API Key o los datos.");

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const name = p.name || "";
      const caract = p.caracteristicas || "";

      const prompt300 = `Genera una descripción breve y atractiva para un producto de joyería. Usa un tono cercano, cálido y profesional, como lo haría DJOYAS. Dirígete en segunda persona plural ("ustedes"), sin exageraciones, ni hablar de energías o poderes. Usa lenguaje positivo, emocional y respetuoso. Máximo 300 caracteres.\\n\\nNombre del producto: ${name}\\nCaracterísticas: ${caract}`;
      
      const prompt900 = `Crea una descripción extensa y emocional para este producto de joyería. El tono debe ser cercano, directo, profesional, lleno de amor y humildad, como lo haría DJOYAS. Usa segunda persona plural ("ustedes") y evita términos como poder, energía, ritual, lucha. Enfócate en el propósito, la belleza de compartir y crear con estas joyas.\\n\\nNombre del producto: ${name}\\nCaracterísticas: ${caract}\\n\\nLongitud aproximada: 900 caracteres.`;

      const desc300 = await getOpenAICompletion(prompt300);
      const desc900 = await getOpenAICompletion(prompt900);

      products[i]["descripcion_300"] = desc300;
      products[i]["descripcion_900"] = desc900;

      output.textContent = `Generando descripciones... ${i + 1} / ${products.length}`;
    }

    const worksheet = XLSX.utils.json_to_sheet(products);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, worksheet, "Productos");
    const wbout = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "productos_con_descripciones.xlsx";
    link.click();
  }

  async function getOpenAICompletion(prompt) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
});

