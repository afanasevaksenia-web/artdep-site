import { ChangeEvent, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react'
import { read, utils } from 'xlsx'
import { supabase } from '../lib/supabase'

type RawRow = Record<string, unknown>

type FieldKey =
  | 'shootDate'
  | 'dayNumber'
  | 'episode'
  | 'sceneNumber'
  | 'intExt'
  | 'timeOfDay'
  | 'location'
  | 'setName'
  | 'description'
  | 'cast'
  | 'extras'
  | 'props'
  | 'personalProps'
  | 'transport'
  | 'animals'
  | 'weapons'
  | 'food'
  | 'setDressing'
  | 'graphicProps'
  | 'notes'

type Mapping = Partial<Record<FieldKey, string>>

type KppImportProps = {
  projectId: string
  onImported: () => Promise<void> | void
}

const fields: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: 'shootDate', label: 'Дата съёмки', required: true },
  { key: 'dayNumber', label: '№ смены' },
  { key: 'episode', label: 'Серия' },
  { key: 'sceneNumber', label: '№ сцены', required: true },
  { key: 'intExt', label: 'INT / EXT' },
  { key: 'timeOfDay', label: 'День / ночь' },
  { key: 'location', label: 'Локация' },
  { key: 'setName', label: 'Объект / декорация' },
  { key: 'description', label: 'Описание сцены' },
  { key: 'cast', label: 'Актёры / персонажи' },
  { key: 'extras', label: 'Массовка' },
  { key: 'props', label: 'Реквизит' },
  { key: 'personalProps', label: 'Личный реквизит' },
  { key: 'transport', label: 'Транспорт' },
  { key: 'animals', label: 'Животные' },
  { key: 'weapons', label: 'Оружие' },
  { key: 'food', label: 'Еда' },
  { key: 'setDressing', label: 'Обстановочный реквизит' },
  { key: 'graphicProps', label: 'Графический реквизит' },
  { key: 'notes', label: 'Примечания' },
]

const aliases: Record<FieldKey, string[]> = {
  shootDate: ['дата', 'дата съемки', 'дата съёмки', 'shoot date'],
  dayNumber: ['смена', '№ смены', 'номер смены', 'съемочный день', 'съёмочный день', 'день съемки', 'день съёмки'],
  episode: ['серия', 'эпизод', 'episode'],
  sceneNumber: ['сцена', '№ сцены', 'номер сцены', 'scene', 'scene number'],
  intExt: ['инт/экст', 'инт экст', 'int/ext', 'int ext', 'нат/инт', 'инт/нат'],
  timeOfDay: ['время суток', 'день/ночь', 'д/н', 'time of day'],
  location: ['локация', 'место съемки', 'место съёмки', 'location', 'адрес'],
  setName: ['объект', 'декорация', 'сет', 'set'],
  description: ['описание', 'содержание сцены', 'содержание', 'description'],
  cast: ['актеры', 'актёры', 'персонажи', 'каст', 'cast'],
  extras: ['массовка', 'групповка', 'extras'],
  props: ['реквизит', 'игровой реквизит', 'props'],
  personalProps: ['личный реквизит', 'личка'],
  transport: ['транспорт', 'авто', 'машины', 'vehicles'],
  animals: ['животные', 'animals'],
  weapons: ['оружие', 'оружейный реквизит', 'weapons'],
  food: ['еда', 'продукты', 'food'],
  setDressing: ['обстановочный', 'обстановочный реквизит', 'мебель', 'set dressing'],
  graphicProps: ['графический', 'графический реквизит', 'полиграфия', 'graphic props'],
  notes: ['примечание', 'примечания', 'комментарий', 'комментарии', 'notes'],
}

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[№#]/g, 'номер')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()
}

function inferMapping(headers: string[]): Mapping {
  const result: Mapping = {}
  for (const field of fields) {
    const wanted = aliases[field.key].map(normalize)
    const exact = headers.find((header) => wanted.includes(normalize(header)))
    const partial = headers.find((header) => wanted.some((alias) => normalize(header).includes(alias) || alias.includes(normalize(header))))
    if (exact || partial) result[field.key] = exact ?? partial
  }
  return result
}

function text(row: RawRow, column?: string) {
  if (!column) return ''
  const value = row[column]
  if (value instanceof Date) return value.toLocaleDateString('ru-RU')
  return String(value ?? '').trim()
}

function parseDayNumber(value: string) {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : null
}

function toISODate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const raw = String(value ?? '').trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`

  const ru = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/)
  if (ru) {
    const year = ru[3].length === 2 ? `20${ru[3]}` : ru[3]
    return `${year}-${ru[2].padStart(2, '0')}-${ru[1].padStart(2, '0')}`
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return null
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Zа-яА-Я0-9._-]+/g, '_').slice(0, 120)
}

export default function KppImport({ projectId, onImported }: KppImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<RawRow[]>([])
  const [mapping, setMapping] = useState<Mapping>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const validation = useMemo(() => {
    const errors: string[] = []
    if (!mapping.sceneNumber) errors.push('Не выбрана колонка «№ сцены».')
    if (!mapping.shootDate) errors.push('Не выбрана колонка «Дата съёмки».')

    let validRows = 0
    let badDates = 0
    let emptyScenes = 0
    for (const row of rows) {
      if (!text(row, mapping.sceneNumber)) {
        emptyScenes += 1
        continue
      }
      if (!toISODate(mapping.shootDate ? row[mapping.shootDate] : null)) {
        badDates += 1
        continue
      }
      validRows += 1
    }
    if (emptyScenes) errors.push(`Строк без номера сцены: ${emptyScenes}.`)
    if (badDates) errors.push(`Строк с непонятной датой: ${badDates}.`)
    return { errors, validRows, badDates, emptyScenes }
  }, [rows, mapping])

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return
    setMessage('')
    if (selected.size > 6 * 1024 * 1024) {
      setMessage('Файл больше 6 МБ. Для обычного КПП этого обычно не требуется — уменьшите файл или сохраните только рабочий лист.')
      return
    }

    try {
      const buffer = await selected.arrayBuffer()
      const workbook = read(buffer, { type: 'array', cellDates: true })
      const firstSheet = workbook.SheetNames[0]
      if (!firstSheet) throw new Error('В файле нет листов')
      const parsed = utils.sheet_to_json<RawRow>(workbook.Sheets[firstSheet], { defval: '', raw: true })
      if (!parsed.length) throw new Error('На первом листе не найдено строк с данными')
      const foundHeaders = Object.keys(parsed[0])
      setFile(selected)
      setSheetName(firstSheet)
      setRows(parsed)
      setHeaders(foundHeaders)
      setMapping(inferMapping(foundHeaders))
    } catch (error) {
      setFile(null)
      setRows([])
      setHeaders([])
      setMapping({})
      setMessage(error instanceof Error ? error.message : 'Не удалось прочитать файл')
    }
  }

  function changeMapping(key: FieldKey, value: string) {
    setMapping((current) => ({ ...current, [key]: value || undefined }))
  }

  async function importKpp() {
    if (!file || !rows.length || validation.errors.length) return
    setBusy(true)
    setMessage('')
    let importId: string | null = null

    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) throw new Error('Сессия закончилась. Войдите в аккаунт снова.')

      const timestamp = Date.now()
      const storagePath = `${projectId}/kpp/${timestamp}-${safeName(file.name)}`
      const upload = await supabase.storage.from('project-files').upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      })
      if (upload.error) throw upload.error

      const createdImport = await supabase
        .from('kpp_imports')
        .insert({
          project_id: projectId,
          file_name: file.name,
          storage_path: storagePath,
          status: 'parsing',
          rows_total: rows.length,
          mapping,
          source_headers: headers,
          uploaded_by: userId,
        })
        .select('id')
        .single()
      if (createdImport.error) throw createdImport.error
      importId = createdImport.data.id

      const prepared = rows
        .map((row, index) => ({
          row,
          index,
          shootDate: toISODate(mapping.shootDate ? row[mapping.shootDate] : null),
          sceneNumber: text(row, mapping.sceneNumber),
          dayNumber: parseDayNumber(text(row, mapping.dayNumber)),
        }))
        .filter((item) => item.shootDate && item.sceneNumber)

      const uniqueDates = [...new Set(prepared.map((item) => item.shootDate as string))].sort()
      const derivedDayByDate = new Map(uniqueDates.map((date, index) => [date, index + 1]))

      const existingDaysResult = await supabase
        .from('shoot_days')
        .select('id,shoot_date,day_number')
        .eq('project_id', projectId)
      if (existingDaysResult.error) throw existingDaysResult.error
      const existingDays = existingDaysResult.data ?? []
      const shootDayIdByDate = new Map<string, string>()

      for (const date of uniqueDates) {
        const rowsForDate = prepared.filter((item) => item.shootDate === date)
        const explicitDay = rowsForDate.map((item) => item.dayNumber).find((n): n is number => Boolean(n))
        const dayNumber = explicitDay ?? derivedDayByDate.get(date) ?? 1
        const locations = [...new Set(rowsForDate.map((item) => text(item.row, mapping.location)).filter(Boolean))]
        const existing = existingDays.find((day) => day.shoot_date === date)

        if (existing) {
          const updated = await supabase
            .from('shoot_days')
            .update({ day_number: dayNumber, location_summary: locations.join(' · ') })
            .eq('id', existing.id)
            .select('id')
            .single()
          if (updated.error) throw updated.error
          shootDayIdByDate.set(date, updated.data.id)
        } else {
          const inserted = await supabase
            .from('shoot_days')
            .insert({
              project_id: projectId,
              shoot_date: date,
              day_number: dayNumber,
              title: `Смена ${dayNumber}`,
              location_summary: locations.join(' · '),
            })
            .select('id')
            .single()
          if (inserted.error) throw inserted.error
          shootDayIdByDate.set(date, inserted.data.id)
        }
      }

      const existingScenesResult = await supabase
        .from('scenes')
        .select('id,episode,scene_number')
        .eq('project_id', projectId)
      if (existingScenesResult.error) throw existingScenesResult.error
      const existingScenes = existingScenesResult.data ?? []
      const existingByKey = new Map(
        existingScenes.map((scene) => [`${normalize(scene.episode)}::${normalize(scene.scene_number)}`, scene.id]),
      )

      let imported = 0
      for (const item of prepared) {
        const row = item.row
        const episode = text(row, mapping.episode)
        const sceneNumber = item.sceneNumber
        const payload = {
          project_id: projectId,
          shoot_day_id: shootDayIdByDate.get(item.shootDate as string) ?? null,
          episode,
          scene_number: sceneNumber,
          int_ext: text(row, mapping.intExt),
          time_of_day: text(row, mapping.timeOfDay),
          location: text(row, mapping.location),
          set_name: text(row, mapping.setName),
          description: text(row, mapping.description),
          cast_text: text(row, mapping.cast),
          extras_text: text(row, mapping.extras),
          props_text: text(row, mapping.props),
          personal_props_text: text(row, mapping.personalProps),
          transport_text: text(row, mapping.transport),
          animals_text: text(row, mapping.animals),
          weapons_text: text(row, mapping.weapons),
          food_text: text(row, mapping.food),
          set_dressing_text: text(row, mapping.setDressing),
          graphic_props_text: text(row, mapping.graphicProps),
          kpp_notes: text(row, mapping.notes),
          script_order: item.index + 1,
          source_row: JSON.parse(JSON.stringify(row)),
        }
        const key = `${normalize(episode)}::${normalize(sceneNumber)}`
        const existingId = existingByKey.get(key)

        if (existingId) {
          const updated = await supabase.from('scenes').update(payload).eq('id', existingId)
          if (updated.error) throw updated.error
        } else {
          const inserted = await supabase.from('scenes').insert(payload).select('id').single()
          if (inserted.error) throw inserted.error
          existingByKey.set(key, inserted.data.id)
        }
        imported += 1
      }

      const finish = await supabase
        .from('kpp_imports')
        .update({ status: 'imported', rows_imported: imported, completed_at: new Date().toISOString() })
        .eq('id', importId)
      if (finish.error) throw finish.error

      setMessage(`Готово: импортировано ${imported} сцен. Исходный файл сохранён в проекте.`)
      await onImported()
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Ошибка импорта КПП'
      if (importId) {
        await supabase
          .from('kpp_imports')
          .update({ status: 'failed', error_text: errorText, completed_at: new Date().toISOString() })
          .eq('id', importId)
      }
      setMessage(errorText)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel kpp-import">
      <div className="panel-head">
        <div>
          <h3>Загрузить КПП</h3>
          <p>Excel .xlsx/.xls или CSV → проверка колонок → импорт съёмочных дней и сцен.</p>
        </div>
      </div>

      <label className="upload-zone">
        <UploadCloud size={30} />
        <strong>{file ? file.name : 'Выберите файл КПП'}</strong>
        <span>{file ? `Лист: ${sheetName} · строк: ${rows.length}` : 'Поддерживаются .xlsx, .xls и .csv до 6 МБ'}</span>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={selectFile} />
      </label>

      {headers.length > 0 && (
        <>
          <div className="import-summary">
            <div><strong>{rows.length}</strong><span>строк в файле</span></div>
            <div><strong>{validation.validRows}</strong><span>готово к импорту</span></div>
            <div><strong>{validation.errors.length}</strong><span>предупреждений</span></div>
          </div>

          <div className="mapping-grid">
            {fields.map((field) => (
              <label key={field.key}>
                <span>{field.label}{field.required ? ' *' : ''}</span>
                <select value={mapping[field.key] ?? ''} onChange={(event) => changeMapping(field.key, event.target.value)}>
                  <option value="">— не импортировать —</option>
                  {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                </select>
              </label>
            ))}
          </div>

          {validation.errors.length > 0 ? (
            <div className="validation-box warning">
              <AlertTriangle size={19} />
              <div>{validation.errors.map((error) => <div key={error}>{error}</div>)}</div>
            </div>
          ) : (
            <div className="validation-box success">
              <CheckCircle2 size={19} />
              <div>Файл готов к импорту. Существующие сцены с тем же номером и серией будут обновлены.</div>
            </div>
          )}

          <div className="preview-wrap">
            <div className="preview-title"><FileSpreadsheet size={18} /> Предпросмотр первых строк</div>
            <table>
              <thead><tr><th>Смена</th><th>Дата</th><th>Серия</th><th>Сцена</th><th>Локация</th><th>Реквизит</th></tr></thead>
              <tbody>
                {rows.slice(0, 8).map((row, index) => (
                  <tr key={index}>
                    <td>{text(row, mapping.dayNumber) || '—'}</td>
                    <td>{mapping.shootDate ? toISODate(row[mapping.shootDate]) ?? text(row, mapping.shootDate) : '—'}</td>
                    <td>{text(row, mapping.episode) || '—'}</td>
                    <td><strong>{text(row, mapping.sceneNumber) || '—'}</strong></td>
                    <td>{text(row, mapping.location) || '—'}</td>
                    <td>{text(row, mapping.props) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="primary import-button" disabled={busy || validation.errors.length > 0} onClick={importKpp}>
            {busy ? 'Импортирую КПП…' : `Импортировать ${validation.validRows} сцен`}
          </button>
        </>
      )}

      {message && <div className="notice import-notice">{message}</div>}
    </section>
  )
}
