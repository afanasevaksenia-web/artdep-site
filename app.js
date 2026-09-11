const SUPABASE_FUNCTION_URL = "https://qnuysxrhoaguhyvtxgls.supabase.co/functions/v1/analyze-script";
const SUPABASE_ANON_KEY = "sb_publishable_EF9DoRgy4vJZ0CezkC2GLQ_nro5WLZ0";

const CATEGORIES = [
  { key: "props", label: "🎭 Реквизит" },
  { key: "decorations", label: "🏛️ Декорации / локации" },
  { key: "animals", label: "🐾 Животные" },
  { key: "vehicles", label: "🚗 Транспорт" },
];

function renderResult(data) {
  const resultBox = document.getElementById("result");
  resultBox.innerHTML = "";

  const hasAny = CATEGORIES.some((c) => Array.isArray(data[c.key]) && data[c.key].length > 0);
  if (!hasAny) {
    resultBox.textContent = "Ничего не найдено в сценарии.";
    return;
  }

  for (const { key, label } of CATEGORIES) {
    const items = Array.isArray(data[key]) ? data[key] : [];
    if (items.length === 0) continue;

    const section = document.createElement("section");
    section.className = "category";

    const heading = document.createElement("h2");
    heading.textContent = label;
    section.appendChild(heading);

    const list = document.createElement("ul");
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = String(item);
      list.appendChild(li);
    }
    section.appendChild(list);

    resultBox.appendChild(section);
  }
}

async function analyzeScript() {
  const scriptText = document.getElementById("script").value.trim();
  const resultBox = document.getElementById("result");
  const button = document.getElementById("analyze");

  if (!scriptText) {
    resultBox.textContent = "❗ Введи текст сценария!";
    return;
  }

  resultBox.textContent = "🧠 Анализирую сценарий...";
  button.disabled = true;

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ script: scriptText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Ошибка сервера (${response.status})`);
    }

    renderResult(data);
  } catch (err) {
    resultBox.textContent = "⚠️ Ошибка: " + err.message;
  } finally {
    button.disabled = false;
  }
}

document.getElementById("analyze").addEventListener("click", analyzeScript);
