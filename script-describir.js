let apiKey = "";
let products = [];
let promptTemplate300 = `Genera una descripción breve y atractiva para un producto de joyería. Usa un tono cercano, cálido y profesional, como lo haría DJOYAS. Dirígete en segunda persona plural ("ustedes"), sin exageraciones, ni hablar de energías o poderes. Usa lenguaje positivo, emocional y respetuoso. Máximo 300 caracteres.

Nombre del producto: {{name}}
Características: {{caracteristicas}}`;

let promptTemplate900 = `Crea una descripción extensa y emocional para este producto de joyería. El tono debe ser cercano, directo, profesional, lleno de amor y humildad, como lo haría DJOYAS. Usa segunda persona plural ("ustedes") y evita términos como poder, energía, ritual, lucha. Enfócate en el propósito, la belleza de compartir y crear con estas joyas.

Nombre del producto: {{name}}
Características: {{caracteristicas}}

Longitud aproximada: 900 caracteres.`;

document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("upload");
  const downloadBtn = document.getElementById("download");
  const apiKeyInput = document.getElementById("apikey");
  const output = document.getElementById("output");

  // Prompts
  document.getElementById("prompt300").value = promptTemplate300;
  document.getElementById("prompt900").value = promptTemplate900;

  document.getElementById("editPrompt300").addEventListener("click", () => {
    openModal("modal300");
  });

  document.getElementById("editPrompt900").addEventListener("click", () => {
    openModal("modal900");
  });

  apiKeyInput.addEventListener("input", (e) => {
    apiKey = e.target.value.trim();
  });

  uploadInput.addEventListener("change", handleCSVUpload);
  downloadBtn.addEventListener("click", generateDescriptions);
});

function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";

  if (id === "modal300") {
    promptTemplate300 = document.getElementById("prompt300").value;
  } else if (id === "modal900") {
    promptTemplate900 = document.getElementById("prompt900").value;
  }
}

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const csv = e.target.result;
    const rows = csv.split("\\n").map((row) => row.split(","));
    const headers = rows[0];
    products = rows.slice(1).map((row) =>
      headers.reduce((obj, header, i) => {
        obj[header.trim()] = row[i]?.trim();
        return obj;
      }, {})
    );
    document.getElementById("output").textContent = `Archivo cargado: ${products.length} productos.`;
    document.getElementById("download").disabled = false;
  };
  reader.readAsText(file);
}

async function generateDescriptions() {
  if (!apiKey || products.length === 0) {
    alert("Falta la API Key o los productos.");
    return;
  }

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const name = p.name || "";
    const caract = p.caracteristicas || "";

    const prompt300 = promptTemplate300
      .replace("{{name}}", name)
      .replace("{{caracteristicas}}", caract);

    const prompt900 = promptTemplate900
      .replace("{{name}}", name)
      .replace("{{caracteristicas}}", caract);

    const desc300 = await getOpenAIResponse(prompt300);
    const desc900 = await getOpenAIResponse(prompt900);

    products[i]["descripcion_300"] = desc300;
    products[i]["descripcion_900"] = desc900;

    document.getElementById("output").textContent = `Procesando ${i + 1} de ${products.length}...`;
  }

  exportToCSV(products);
}

async function getOpenAIResponse(prompt) {
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
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function exportToCSV(data) {
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`));
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "productos_con_descripciones.csv";
  link.click();
}
