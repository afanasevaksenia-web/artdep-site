import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, Camera, CheckCircle2, ChevronRight, Clapperboard, ListChecks, MapPin, RefreshCw, Search, Truck, Users } from 'lucide-react'
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
  transport_confirmed: boolean
  animals_text: string
  weapons_text: string
  food_text: string
  set_dressing_text: string
  graphic_props_text: string
  kpp_notes: string
  status: string
  script_order: number | null
}

type SceneProp = { scene_id: string; prop_id: string }
type PropStatus = { id: string; readiness: string }
type TaskStatus = { id: string; scene_id: string | null; shoot_day_id: string | null; status: string; due_at: string | null }
type MediaStatus = { scene_id: string | null; kind: string }
type Props = { projectId: string }
type IssueFilter = 'none' | 'props' | 'tasks' | 'photos' | 'transport'

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

function isReady(value: string) {
  return String(value || '').trim().toLowerCase() === 'ready'
}

function isDone(value: string) {
  return ['done', 'cancelled'].includes(String(value || '').trim().toLowerCase())
}

export default function KppBoard({ projectId }: Props) {
  const [days, setDays] = useState<ShootDay[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [sceneProps, setSceneProps] = useState<SceneProp[]>([])
  const [propStatuses, setPropStatuses] = useState<PropStatus[]>([])
  const [tasks, setTasks] = useState<TaskStatus[]>([])
  const [media, setMedia] = useState<MediaStatus[]>([])
  const [dayId, setDayId] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('none')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const [daysResult, scenesResult, linksResult, propsResult, tasksResult, mediaResult] = await Promise.all([
      supabase.from('shoot_days').select('id,day_number,shoot_date,title,location_summary,status').eq('project_id', projectId).order('shoot_date'),
      supabase.from('scenes').select('id,shoot_day_id,episode,scene_number,int_ext,time_of_day,location,set_name,description,cast_text,extras_text,props_text,personal_props_text,transport_text,transport_confirmed,animals_text,weapons_text,food_text,set_dressing_text,graphic_props_text,kpp_notes,status,script_order').eq('project_id', projectId).order('script_order'),
      supabase.from('scene_props').select('scene_id,prop_id').eq('project_id', projectId),
      supabase.from('props').select('id,readiness').eq('project_id', projectId),
      supabase.from('tasks').select('id,scene_id,shoot_day_id,status,due_at').eq('project_id', projectId),
      supabase.from('media').select('scene_id,kind').eq('project_id', projectId).eq('kind', 'photo'),
    ])
    const firstError = daysResult.error || scenesResult.error || linksResult.error || propsResult.error || tasksResult.error || mediaResult.error
    if (firstError) {
      setError(firstError.message || 'Не удалось загрузить КПП')
    } else {
      setDays((daysResult.data ?? []) as ShootDay[])
      setScenes((scenesResult.data ?? []) as Scene[])
      setSceneProps((linksResult.data ?? []) as SceneProp[])
      setPropStatuses((propsResult.data ?? []) as PropStatus[])
      setTasks((tasksResult.data ?? []) as TaskStatus[])
      setMedia((mediaResult.data ?? []) as MediaStatus[])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`kpp-board-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shoot_days', filter: `project_id=eq.${projectId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scenes', filter: `project_id=eq.${projectId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scene_props', filter: `project_id=eq.${projectId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'props', filter: `project_id=eq.${projectId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media', filter: `project_id=eq.${projectId}` }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  const selected = scenes.find((scene) => scene.id === selectedId) ?? null
  const activeDay = days.find((day) => day.id === dayId) ?? null

  const scopeScenes = useMemo(
    () => dayId === 'all' ? scenes : scenes.filter((scene) => scene.shoot_day_id === dayId),
    [scenes, dayId],
  )

  const readinessMetrics = useMemo(() => {
    const scopeIds = new Set(scopeScenes.map((scene) => scene.id))
    const propById = new Map(propStatuses.map((prop) => [prop.id, prop.readiness]))
    const links = sceneProps.filter((link) => scopeIds.has(link.scene_id))
    const linksByScene = new Map<string, SceneProp[]>()
    for (const link of links) linksByScene.set(link.scene_id, [...(linksByScene.get(link.scene_id) ?? []), link])

    const problemPropScenes = new Set<string>()
    let propChecks = 0
    let propReady = 0
    for (const scene of scopeScenes) {
      const sceneLinks = linksByScene.get(scene.id) ?? []
      for (const link of sceneLinks) {
        propChecks += 1
        if (isReady(propById.get(link.prop_id) ?? '')) propReady += 1
        else problemPropScenes.add(scene.id)
      }
      const importedPropsExist = Boolean(scene.props_text?.trim() || scene.personal_props_text?.trim())
      if (importedPropsExist && sceneLinks.length === 0) {
        propChecks += 1
        problemPropScenes.add(scene.id)
      }
    }

    const relevantTasks = tasks.filter((task) => {
      if (dayId === 'all') return true
      return task.shoot_day_id === dayId || Boolean(task.scene_id && scopeIds.has(task.scene_id))
    })
    const openTasks = relevantTasks.filter((task) => !isDone(task.status))
    const now = Date.now()
    const overdueTasks = openTasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < now)
    const taskProblemScenes = new Set(openTasks.map((task) => task.scene_id).filter((id): id is string => Boolean(id)))

    const photoSceneIds = new Set(media.map((item) => item.scene_id).filter((id): id is string => Boolean(id)))
    const missingPhotoScenes = new Set(scopeScenes.filter((scene) => !photoSceneIds.has(scene.id)).map((scene) => scene.id))

    const transportScenes = scopeScenes.filter((scene) => Boolean(scene.transport_text?.trim()))
    const unconfirmedTransportScenes = new Set(transportScenes.filter((scene) => !scene.transport_confirmed).map((scene) => scene.id))

    const taskChecks = relevantTasks.length
    const taskReady = relevantTasks.filter((task) => isDone(task.status)).length
    const transportChecks = transportScenes.length
    const transportReady = transportScenes.filter((scene) => scene.transport_confirmed).length
    const checks = propChecks + taskChecks + transportChecks
    const ready = propReady + taskReady + transportReady
    const readiness = checks ? Math.round((ready / checks) * 100) : 100

    return {
      readiness,
      propChecks,
      propReady,
      problemPropScenes,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      taskProblemScenes,
      missingPhotoScenes,
      transportChecks,
      transportReady,
      unconfirmedTransportScenes,
    }
  }, [scopeScenes, propStatuses, sceneProps, tasks, media, dayId])

  const issueSceneIds = useMemo(() => {
    if (issueFilter === 'props') return readinessMetrics.problemPropScenes
    if (issueFilter === 'tasks') return readinessMetrics.taskProblemScenes
    if (issueFilter === 'photos') return readinessMetrics.missingPhotoScenes
    if (issueFilter === 'transport') return readinessMetrics.unconfirmedTransportScenes
    return null
  }, [issueFilter, readinessMetrics])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scenes.filter((scene) => {
      if (dayId !== 'all' && scene.shoot_day_id !== dayId) return false
      if (issueSceneIds && !issueSceneIds.has(scene.id)) return false
      if (!q) return true
      return [scene.episode, scene.scene_number, scene.location, scene.set_name, scene.cast_text, scene.props_text, scene.description]
        .some((value) => String(value ?? '').toLowerCase().includes(q))
    })
  }, [scenes, dayId, query, issueSceneIds])

  const scenesByDay = useMemo(() => {
    const result = new Map<string, number>()
    for (const scene of scenes) if (scene.shoot_day_id) result.set(scene.shoot_day_id, (result.get(scene.shoot_day_id) ?? 0) + 1)
    return result
  }, [scenes])

  function toggleIssueFilter(next: IssueFilter) {
    setIssueFilter((current) => current === next ? 'none' : next)
    setSelectedId(null)
  }

  async function toggleTransportConfirmed(scene: Scene) {
    const result = await supabase.from('scenes').update({ transport_confirmed: !scene.transport_confirmed }).eq('id', scene.id)
    if (result.error) setError(result.error.message)
  }

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

      <div className="day-readiness-strip">
        <div className="day-readiness-main">
          <div className="readiness-score"><strong>{readinessMetrics.readiness}%</strong><span>{dayId === 'all' ? 'готовность проекта' : 'готовность смены'}</span></div>
          <div className="readiness-progress"><span style={{ width: `${readinessMetrics.readiness}%` }}/></div>
          <small>Считается по связанному реквизиту, заданиям и подтверждённому транспорту.</small>
        </div>
        <button className={issueFilter === 'props' ? 'readiness-alert active' : 'readiness-alert'} onClick={() => toggleIssueFilter('props')}>
          <AlertTriangle size={18}/><strong>{readinessMetrics.problemPropScenes.size}</strong><span>сцен с неготовым реквизитом</span>
          <small>{readinessMetrics.propReady}/{readinessMetrics.propChecks} позиций готовы</small>
        </button>
        <button className={issueFilter === 'tasks' ? 'readiness-alert active' : 'readiness-alert'} onClick={() => toggleIssueFilter('tasks')}>
          <ListChecks size={18}/><strong>{readinessMetrics.openTasks}</strong><span>открытых заданий</span>
          <small>{readinessMetrics.overdueTasks ? `${readinessMetrics.overdueTasks} просрочено` : 'без просрочек'}</small>
        </button>
        <button className={issueFilter === 'photos' ? 'readiness-alert active' : 'readiness-alert'} onClick={() => toggleIssueFilter('photos')}>
          <Camera size={18}/><strong>{readinessMetrics.missingPhotoScenes.size}</strong><span>сцен без фото стыка</span>
          <small>нажмите, чтобы отфильтровать</small>
        </button>
        <button className={issueFilter === 'transport' ? 'readiness-alert active' : 'readiness-alert'} onClick={() => toggleIssueFilter('transport')}>
          <Truck size={18}/><strong>{readinessMetrics.unconfirmedTransportScenes.size}</strong><span>транспорт не подтверждён</span>
          <small>{readinessMetrics.transportReady}/{readinessMetrics.transportChecks} подтверждено</small>
        </button>
      </div>

      {error && <div className="notice">{error}</div>}
      {loading && !scenes.length ? <div className="kpp-loading">Загружаю КПП…</div> : (
        <div className="kpp-layout">
          <aside className="shoot-day-rail">
            <button className={dayId === 'all' ? 'shoot-day active' : 'shoot-day'} onClick={() => { setDayId('all'); setIssueFilter('none') }}>
              <span className="day-number"><Clapperboard size={16}/></span>
              <span><strong>Все смены</strong><small>{scenes.length} сцен</small></span>
            </button>
            {days.map((day) => (
              <button key={day.id} className={dayId === day.id ? 'shoot-day active' : 'shoot-day'} onClick={() => { setDayId(day.id); setIssueFilter('none'); setSelectedId(null) }}>
                <span className="day-number">{day.day_number}</span>
                <span><strong>{dateLabel(day.shoot_date)}</strong><small>{scenesByDay.get(day.id) ?? 0} сцен{day.location_summary ? ` · ${day.location_summary}` : ''}</small></span>
              </button>
            ))}
          </aside>

          <div className="kpp-table-wrap">
            {issueFilter !== 'none' && <div className="active-problem-filter"><span>Показаны только проблемные сцены</span><button onClick={() => setIssueFilter('none')}>Сбросить фильтр</button></div>}
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
                {selected.transport_text && (
                  <button className={selected.transport_confirmed ? 'transport-confirmation confirmed' : 'transport-confirmation'} onClick={() => toggleTransportConfirmed(selected)}>
                    {selected.transport_confirmed ? <CheckCircle2 size={18}/> : <Truck size={18}/>} 
                    <span><strong>{selected.transport_confirmed ? 'Транспорт подтверждён' : 'Транспорт требует подтверждения'}</strong><small>{selected.transport_text}</small></span>
                  </button>
                )}
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
