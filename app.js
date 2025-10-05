async function analyzeScript() {
  const scriptText = document.getElementById("script").value.trim();
  const resultBox = document.getElementById("result");
  if (!scriptText) {
    resultBox.textContent = "❗ Введи текст сценария!";
    return;
  }

  resultBox.textContent = "🧠 Анализирую сценарий...";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer ВСТАВЬ_СВОЙ_OPENAI_API_КЛЮЧ"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `
Ты — реквизитор. Проанализируй сценарий и выдели списки в JSON:
{
 "props": ["предметы"],
 "decorations": ["локации"],
 "animals": ["животные"],
 "vehicles": ["транспорт"]
}
Сценарий: ${scriptText}
`
          }
        ]
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error("Ошибка анализа");
    }
    resultBox.textContent = data.choices[0].message.content;
  } catch (err) {
    resultBox.textContent = "⚠️ Ошибка: " + err.message;
  }
}

document.getElementById("analyze").addEventListener("click", analyzeScript);
