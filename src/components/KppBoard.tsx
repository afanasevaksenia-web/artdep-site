import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronRight, Clapperboard, MapPin, RefreshCw, Search, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SceneWorkPanel from './SceneWorkPanel'

type ShootDay = {
  id: string
  day_number: number
  shoot_date: string
  title: string
  location_summary: string
  status: string
}

type Scene = {
  id: string
  shoot_day_id: string | null
  episode: string
  scene_number: string
  int_ext: string
  time_of_day: string
  location: string
  set_name: string
  description: string
  cast_text: string
  extras_text: string
  props_text: string
  personal_props_text: string
  transport_text: string
  animals_text: string
  weapons_text: string
  food_text: string
  set_dressing_text: string
  graphic_props_text: string
  kpp_notes: string
  status: string
  script_order: number | null
}

type Props = { projectId: string }

const detailRows: { key: keyof Scene; label: string }[] = [
  { key: 'cast_text', label: 'Актёры / персонажи' },
  { key: 'extras_text', label: 'Массовка' },
  { key: 'props_text', label: 'Реквизит из КПП' },
  { key: 'personal_props_text', label: 'Личный реквизит' },
  { key: 'transport_text', label: 'Транспорт' },
  { key: 'animals_text', label: 'Животные' },
  { key: 'weapons_text', label: 'Оружие' },
  { key: 'food_text', label: 'Еда' },
  { key: 'set_dressing_text', label: 'Обстановочный' },
  { key: 'graphic_props_text', label: 'Графический' },
]

function dateLabel(value: string) {
  if (!value) return 'Без даты'
  return new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', weekday: 'short' })
}

export default function KppBoard({ projectId }: Props) {
  const [days, setDays] = useState<ShootDay[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [dayId, setDayId] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const [daysResult, scenesResult] = await Promise.all([
      supabase.from('shoot_days').select('id,day_number,shoot_date,title,location_summary,status').eq('project_id', projectId).order('shoot_date'),
      supabase.from('scenes').select('id,shoot_day_id,episode,scene_number,int_ext,time_of_day,location,set_name,description,cast_text,extras_text,props_text,personal_props_text,transport_text,animals_text,weapons_text,food_text,set_dressing_text,graphic_props_text,kpp_notes,status,script_order').eq('project_id', projectId).order('script_order'),
    ])
    if (daysResult.error || scenesResult.error) {
      setError(daysResult.error?.message || scenesResult.error?.message || 'Не удалось загрузить КПП')
    } else {
      setDays((daysResult.data ?? []) as ShootDay[])
      setScenes((scenesResult.data ?? []) as Scene[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`kpp-board-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shoot_days', filter: `project_id=eq.${projectId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scenes', filter: `project_id=eq.${projectId}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scenes.filter((scene) => {
      if (dayId !== 'all' && scene.shoot_day_id !== dayId) return false
      if (!q) return true
      return [scene.episode, scene.scene_number, scene.location, scene.set_name, scene.cast_text, scene.props_text, scene.description]
        .some((value) => String(value ?? '').toLowerCase().includes(q))
    })
  }, [scenes, dayId, query])

  const selected = scenes.find((scene) => scene.id === selectedId) ?? null
  const activeDay = days.find((day) => day.id === dayId) ?? null
  const scenesByDay = useMemo(() => {
    const result = new Map<string, number>()
    for (const scene of scenes) if (scene.shoot_day_id) result.set(scene.shoot_day_id, (result.get(scene.shoot_day_id) ?? 0) + 1)
    return result
  }, [scenes])

  return (
    <section className="kpp-workspace panel">
      <div className="kpp-toolbar">
        <div>
          <h3>Рабочий КПП</h3>
          <p>{activeDay ? `Смена ${activeDay.day_number} · ${dateLabel(activeDay.shoot_date)}` : `${days.length} смен · ${scenes.length} сцен`}</p>
        </div>
        <div className="kpp-tools">
          <label className="kpp-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Сцена, актёр, локация, реквизит…"/></label>
          <button className="icon-button" onClick={load} title="Обновить"><RefreshCw size={17}/></button>
        </div>
      </div>

      {error && <div className="notice">{error}</div>}
      {loading && !scenes.length ? <div className="kpp-loading">Загружаю КПП…</div> : (
        <div className="kpp-layout">
          <aside className="shoot-day-rail">
            <button className={dayId === 'all' ? 'shoot-day active' : 'shoot-day'} onClick={() => setDayId('all')}>
              <span className="day-number"><Clapperboard size={16}/></span>
              <span><strong>Все смены</strong><small>{scenes.length} сцен</small></span>
            </button>
            {days.map((day) => (
              <button key={day.id} className={dayId === day.id ? 'shoot-day active' : 'shoot-day'} onClick={() => setDayId(day.id)}>
                <span className="day-number">{day.day_number}</span>
                <span><strong>{dateLabel(day.shoot_date)}</strong><small>{scenesByDay.get(day.id) ?? 0} сцен{day.location_summary ? ` · ${day.location_summary}` : ''}</small></span>
              </button>
            ))}
          </aside>

          <div className="kpp-table-wrap">
            <table className="kpp-table">
              <thead><tr><th>Смена</th><th>Серия</th><th>Сцена</th><th>INT/EXT</th><th>Д/Н</th><th>Объект / локация</th><th>Актёры</th><th>Реквизит</th><th>Статус</th><th></th></tr></thead>
              <tbody>
                {visible.map((scene) => {
                  const day = days.find((item) => item.id === scene.shoot_day_id)
                  return (
                    <tr key={scene.id} className={selectedId === scene.id ? 'selected-row' : ''} onClick={() => setSelectedId(scene.id)}>
                      <td>{day?.day_number ?? '—'}</td>
                      <td>{scene.episode || '—'}</td>
                      <td><strong>{scene.scene_number}</strong></td>
                      <td>{scene.int_ext || '—'}</td>
                      <td>{scene.time_of_day || '—'}</td>
                      <td><strong className="cell-title">{scene.set_name || scene.location || '—'}</strong><small>{scene.set_name && scene.location ? scene.location : ''}</small></td>
                      <td className="long-cell">{scene.cast_text || '—'}</td>
                      <td className="long-cell">{scene.props_text || '—'}</td>
                      <td><span className="status">{scene.status || 'planned'}</span></td>
                      <td><ChevronRight size={16}/></td>
                    </tr>
                  )
                })}
                {!visible.length && <tr><td colSpan={10} className="kpp-empty">Нет сцен по выбранному фильтру.</td></tr>}
              </tbody>
            </table>
          </div>

          <aside className={selected ? 'scene-drawer open' : 'scene-drawer'}>
            {selected ? (
              <>
                <div className="scene-drawer-head">
                  <div><span className="eyebrow">КАРТОЧКА СЦЕНЫ</span><h3>{selected.episode ? `${selected.episode} серия · ` : ''}Сцена {selected.scene_number}</h3></div>
                  <button className="drawer-close" onClick={() => setSelectedId(null)}>×</button>
                </div>
                <div className="scene-meta">
                  <span><MapPin size={15}/>{selected.set_name || selected.location || 'Локация не указана'}</span>
                  <span><CalendarDays size={15}/>{days.find((d) => d.id === selected.shoot_day_id)?.shoot_date ? dateLabel(days.find((d) => d.id === selected.shoot_day_id)!.shoot_date) : 'Не назначена на смену'}</span>
                  <span><Users size={15}/>{selected.cast_text || 'Актёры не указаны'}</span>
                </div>
                {selected.description && <div className="scene-description">{selected.description}</div>}
                <div className="scene-detail-list">
                  {detailRows.map(({ key, label }) => {
                    const value = String(selected[key] ?? '').trim()
                    return <div className={value ? 'scene-detail' : 'scene-detail muted'} key={String(key)}><span>{label}</span><strong>{value || '—'}</strong></div>
                  })}
                  <div className="scene-detail"><span>Стыки / примечания КПП</span><strong>{selected.kpp_notes || '—'}</strong></div>
                </div>
                <SceneWorkPanel projectId={projectId} sceneId={selected.id}/>
              </>
            ) : <div className="drawer-placeholder"><ChevronRight size={28}/><strong>Выберите сцену</strong><span>Карточка откроется здесь без перехода на другую страницу.</span></div>}
          </aside>
        </div>
      )}
    </section>
  )
}
