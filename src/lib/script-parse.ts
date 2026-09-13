export type ParsedScene = { id: string; heading: string; body: string };

// Матчит "5-4. НАТ. КЛАДБИЩЕ..." и "INT. HOUSE - DAY" — так же, как размечено
// в либретто/сценах дня этого проекта.
const HEADING_RE = /^(?:\d+[\wа-яёА-ЯЁ-]*\.\s*)?(?:ИНТ|НАТ|INT|EXT|ИНТ\/НАТ|НАТ\/ИНТ)[.\s/]/iu;
const NUMBER_RE = /^(\d+[\wа-яёА-ЯЁ-]*)\./;

export function parseScript(text: string): ParsedScene[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const scenes: ParsedScene[] = [];
  let current: { id: string; heading: string; bodyLines: string[] } | null = null;
  let n = 0;

  function flush() {
    if (current) scenes.push({ id: current.id, heading: current.heading, body: current.bodyLines.join(" ").trim() });
  }

  for (const line of lines) {
    if (!line) continue;
    if (HEADING_RE.test(line)) {
      flush();
      n++;
      const numMatch = line.match(NUMBER_RE);
      current = { id: numMatch ? numMatch[1] : `сц-${n}`, heading: line, bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  flush();
  return scenes;
}
