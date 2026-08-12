import { ChangeEvent, FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Camera, Check, Circle, Link2, PackagePlus, Plus, Trash2, UploadCloud } from 'lucide-react'
import { supabase } from '../lib/supabase'

type PropItem = {
  id: string
  name: string
  category: string
  readiness: string
  quantity: number
  storage_location: string
  acquisition_type: string
}

type SceneProp = {
  id: string
  prop_id: string
  quantity: number
  continuity_details: string
  position_notes: string
  is_hero: boolean
}

type TaskItem = {
  id: string
  title: string
  status: string
  priority: string
  due_at: string | null
}

type MediaItem = {
  id: string
  storage_path: string
  file_name: string
  caption: string
  created_at: string
  signedUrl?: string
}

type Props = {
  projectId: string
  sceneId: string
}

function isReady(value: string) {
  return String(value || '').trim().toLowerCase() === 'ready'
}

function isTaskDone(value: string) {
  return String(value || '').trim().toLowerCase() === 'done'
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Zа-яА-Я0-9._-]+/g, '_').slice(0, 120)
}

export default function SceneWorkPanel({ projectId, sceneId }: Props) {
  const [allProps, setAllProps] = useState<PropItem[]>([])
  const [sceneProps, setSceneProps] = useState<SceneProp[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [propToLink, setPropToLink] = useState('')
  const [newPropName, setNewPropName] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('normal')
  const [photoCaption, setPhotoCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    const [propsResult, linksResult, tasksResult, mediaResult] = await Promise.all([
      supabase.from('props').select('id,name,category,readiness,quantity,storage_location,acquisition_type').eq('project_id', projectId).order('name'),
      supabase.from('scene_props').select('id,prop_id,quantity,continuity_details,position_notes,is_hero').eq('scene_id', sceneId).order('created_at'),
      supabase.from('tasks').select('id,title,status,priority,due_at').eq('project_id', projectId).eq('scene_id', sceneId).order('created_at', { ascending: false }),
      supabase.from('media').select('id,storage_path,file_name,caption,created_at').eq('project_id', projectId).eq('scene_id', sceneId).eq('kind', 'photo').order('created_at', { ascending: false }),
    ])

    const firstError = propsResult.error || linksResult.error || tasksResult.error || mediaResult.error
    if (firstError) {
      setMessage(firstError.message)
      return
    }

    setAllProps((propsResult.data ?? []) as PropItem[])
    setSceneProps((linksResult.data ?? []) as SceneProp[])
    setTasks((tasksResult.data ?? []) as TaskItem[])

    const mediaRows = (mediaResult.data ?? []) as MediaItem[]
    const withUrls = await Promise.all(mediaRows.map(async (item) => {
      const signed = await supabase.storage.from('project-files').createSignedUrl(item.storage_path, 60 * 60)
      return { ...item, signedUrl: signed.data?.signedUrl }
    }))
    setMedia(withUrls)
  }

  useEffect(() => {
    setMessage('')
    load()

    const channel = supabase
      .channel(`scene-work-${sceneId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scene_props', filter: `scene_id=eq.${sceneId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `scene_id=eq.${sceneId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media', filter: `scene_id=eq.${sceneId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'props', filter: `project_id=eq.${projectId}` }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, sceneId])

  const linked = useMemo(() => sceneProps
    .map((link) => ({ ...link, prop: allProps.find((item) => item.id === link.prop_id) }))
    .filter((item) => item.prop), [sceneProps, allProps])

  const linkedIds = useMemo(() => new Set(sceneProps.map((item) => item.prop_id)), [sceneProps])
  const availableProps = allProps.filter((item) => !linkedIds.has(item.id))
  const readyCount = linked.filter((item) => isReady(item.prop?.readiness ?? '')).length
  const readiness = linked.length ? Math.round((readyCount / linked.length) * 100) : 0
  const doneTasks = tasks.filter((item) => isTaskDone(item.status)).length

  async function linkExisting() {
    if (!propToLink) return
    setBusy(true)
    setMessage('')
    const result = await supabase.from('scene_props').insert({ project_id: projectId, scene_id: sceneId, prop_id: propToLink, quantity: 1 })
    if (result.error) setMessage(result.error.message)
    else setPropToLink('')
    setBusy(false)
  }

  async function createAndLinkProp(e: FormEvent) {
    e.preventDefault()
    if (!newPropName.trim()) return
    setBusy(true)
    setMessage('')
    const created = await supabase
      .from('props')
      .insert({ project_id: projectId, name: newPropName.trim(), category: 'Реквизит', readiness: 'needed' })
      .select('id')
      .single()
    if (created.error) {
      setMessage(created.error.message)
      setBusy(false)
      return
    }
    const linkedResult = await supabase.from('scene_props').insert({ project_id: projectId, scene_id: sceneId, prop_id: created.data.id, quantity: 1 })
    if (linkedResult.error) setMessage(linkedResult.error.message)
    else setNewPropName('')
    setBusy(false)
  }

  async function togglePropReady(prop: PropItem) {
    const next = isReady(prop.readiness) ? 'needed' : 'ready'
    const result = await supabase.from('props').update({ readiness: next }).eq('id', prop.id)
    if (result.error) setMessage(result.error.message)
  }

  async function unlinkProp(linkId: string) {
    const result = await supabase.from('scene_props').delete().eq('id', linkId)
    if (result.error) setMessage(result.error.message)
  }

  async function createTask(e: FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setBusy(true)
    const result = await supabase.from('tasks').insert({
      project_id: projectId,
      scene_id: sceneId,
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
    })
    if (result.error) setMessage(result.error.message)
    else {
      setNewTaskTitle('')
      setNewTaskPriority('normal')
    }
    setBusy(false)
  }

  async function toggleTask(task: TaskItem) {
    const result = await supabase.from('tasks').update({
      status: isTaskDone(task.status) ? 'todo' : 'done',
      completed_at: isTaskDone(task.status) ? null : new Date().toISOString(),
    }).eq('id', task.id)
    if (result.error) setMessage(result.error.message)
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Для стыка выберите изображение.')
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      setMessage('Фото больше 6 МБ. Уменьшите размер изображения перед загрузкой.')
      return
    }

    setBusy(true)
    setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      setMessage('Сессия закончилась. Войдите снова.')
      setBusy(false)
      return
    }

    const path = `${projectId}/scenes/${sceneId}/continuity/${Date.now()}-${safeFileName(file.name)}`
    const uploaded = await supabase.storage.from('project-files').upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (uploaded.error) {
      setMessage(uploaded.error.message)
      setBusy(false)
      return
    }

    const inserted = await supabase.from('media').insert({
      project_id: projectId,
      scene_id: sceneId,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      kind: 'photo',
      caption: photoCaption.trim(),
      uploaded_by: userId,
    })
    if (inserted.error) {
      await supabase.storage.from('project-files').remove([path])
      setMessage(inserted.error.message)
    } else {
      setPhotoCaption('')
    }
    setBusy(false)
  }

  return (
    <div className="scene-work-panel">
      <section className="scene-readiness-card">
        <div>
          <span className="eyebrow">ГОТОВНОСТЬ РЕКВИЗИТА СЦЕНЫ</span>
          <strong>{linked.length ? `${readiness}%` : 'Нет позиций'}</strong>
          <small>{linked.length ? `${readyCount} из ${linked.length} готовы` : 'Свяжите реквизит со сценой'}</small>
        </div>
        <div className="readiness-ring" style={{ '--progress': `${readiness * 3.6}deg` } as CSSProperties}><span>{readiness}%</span></div>
      </section>

      <section className="scene-work-section">
        <div className="scene-work-title"><PackagePlus size={17}/><strong>Реквизит сцены</strong><span>{linked.length}</span></div>
        <div className="scene-prop-linker">
          <select value={propToLink} onChange={(e) => setPropToLink(e.target.value)}>
            <option value="">Связать из общего списка…</option>
            {availableProps.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <button className="compact-button" disabled={!propToLink || busy} onClick={linkExisting}><Link2 size={15}/> Связать</button>
        </div>
        <form className="scene-quick-form" onSubmit={createAndLinkProp}>
          <input value={newPropName} onChange={(e) => setNewPropName(e.target.value)} placeholder="Новая позиция прямо из сцены"/>
          <button className="compact-button" disabled={busy}><Plus size={15}/> Создать</button>
        </form>
        <div className="scene-mini-list">
          {linked.map((item) => item.prop && (
            <div className="scene-prop-row" key={item.id}>
              <button className={isReady(item.prop.readiness) ? 'check-button checked' : 'check-button'} onClick={() => togglePropReady(item.prop!)} title="Изменить готовность">
                {isReady(item.prop.readiness) ? <Check size={14}/> : <Circle size={14}/>} 
              </button>
              <div><strong>{item.prop.name}</strong><small>{item.prop.category} · {item.quantity} шт.{item.prop.storage_location ? ` · ${item.prop.storage_location}` : ''}</small></div>
              <span className={isReady(item.prop.readiness) ? 'mini-status ready' : 'mini-status'}>{isReady(item.prop.readiness) ? 'Готов' : 'Не готов'}</span>
              <button className="ghost-icon" onClick={() => unlinkProp(item.id)} title="Убрать связь со сценой"><Trash2 size={14}/></button>
            </div>
          ))}
          {!linked.length && <div className="empty-inline">Пока нет связанных позиций.</div>}
        </div>
      </section>

      <section className="scene-work-section">
        <div className="scene-work-title"><Check size={17}/><strong>Задания по сцене</strong><span>{doneTasks}/{tasks.length}</span></div>
        <form className="scene-task-form" onSubmit={createTask}>
          <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Например: забрать чемодан из аренды"/>
          <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
            <option value="normal">Обычный</option><option value="high">Высокий</option><option value="urgent">Срочно</option><option value="low">Низкий</option>
          </select>
          <button className="compact-button" disabled={busy}><Plus size={15}/></button>
        </form>
        <div className="scene-mini-list">
          {tasks.map((task) => (
            <button className={isTaskDone(task.status) ? 'scene-task-row done' : 'scene-task-row'} key={task.id} onClick={() => toggleTask(task)}>
              <span className={isTaskDone(task.status) ? 'check-button checked' : 'check-button'}>{isTaskDone(task.status) ? <Check size={14}/> : <Circle size={14}/>}</span>
              <span><strong>{task.title}</strong><small>{task.priority}{task.due_at ? ` · до ${new Date(task.due_at).toLocaleDateString('ru-RU')}` : ''}</small></span>
            </button>
          ))}
          {!tasks.length && <div className="empty-inline">Заданий по этой сцене пока нет.</div>}
        </div>
      </section>

      <section className="scene-work-section">
        <div className="scene-work-title"><Camera size={17}/><strong>Фото стыков</strong><span>{media.length}</span></div>
        <div className="continuity-upload">
          <input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="Подпись: положение, уровень жидкости, повреждение…"/>
          <label className={busy ? 'compact-button disabled' : 'compact-button'}><UploadCloud size={15}/> Фото<input type="file" accept="image/*" onChange={uploadPhoto} disabled={busy}/></label>
        </div>
        <div className="continuity-grid">
          {media.map((item) => (
            <figure key={item.id}>
              {item.signedUrl ? <img src={item.signedUrl} alt={item.caption || item.file_name}/> : <div className="photo-placeholder"><Camera size={22}/></div>}
              <figcaption><strong>{item.caption || 'Фото стыка'}</strong><small>{new Date(item.created_at).toLocaleString('ru-RU')}</small></figcaption>
            </figure>
          ))}
          {!media.length && <div className="empty-inline">Фото стыков ещё не загружены.</div>}
        </div>
      </section>

      {message && <div className="notice scene-work-notice">{message}</div>}
    </div>
  )
}
