import JSZip from "jszip";

/** Pulls plain text out of a .docx (a zip of XML) — paragraphs joined by newlines. */
export async function docxToText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("Не нашли word/document.xml — это точно .docx?");

  const paragraphs = xml.split(/<w:p[ />]/).slice(1);
  const lines = paragraphs.map((p) => {
    const runs = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
    return runs
      .join("")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  });
  return lines.join("\n");
}
