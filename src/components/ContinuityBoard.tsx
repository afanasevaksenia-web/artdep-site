import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, ChevronRight, Link2, Plus, Trash2, UploadCloud } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Group = { id: string; title: string; description: string }
type Scene = { id: string; episode: string; scene_number: string; set_name: string; location: string; shoot_day_id: string | null; script_order: number | null }
type ShootDay = { id: string; day_number: number; shoot_date: string }
type GroupScene = { group_id: string; scene_id: string; sort_order: number; notes: string; match_previous: boolean; change_reason: string }
type PropItem = { id: string; name: string; category: string }
type ContinuityItem = { id: string; project_id: string; group_id: string; prop_id: string | null; title: string; category: string; same_across_scenes: boolean; notes: string }
type ItemState = { id: string; item_id: string; scene_id: string; state_text: string; quantity: number; position_notes: string; condition_notes: string; intentional_change: boolean; change_reason: string }
type MediaItem = { id: string; scene_id: string | null; continuity_item_id: string | null; storage_path: string; file_name: string; caption: string; created_at: string; signedUrl?: string }

type Props = { projectId: string }

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function stateSignature(state?: ItemState) {
  if (!state) return ''
  return normalize([state.state_text, state.quantity, state.position_notes, state.condition_notes].join('|'))
}

function dateLabel(value: string) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Zа-яА-Я0-9._-]+/g, '_').slice(0, 120)
}

export default function ContinuityBoard({ projectId }: Props) {
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [shootDays, setShootDays] = useState<ShootDay[]>([])
  const [props, setProps] = useState<PropItem[]>([])
  const [groupScenes, setGroupScenes] = useState<GroupScene[]>([])
  const [items, setItems] = useState<ContinuityItem[]>([])
  const [states, setStates] = useState<ItemState[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [sceneToAdd, setSceneToAdd] = useState('')
  const [propToAdd, setPropToAdd] = useState('')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [sameAcrossScenes, setSameAcrossScenes] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null

  async function loadBase() {
    const [groupsResult, scenesResult, daysResult, propsResult] = await Promise.all([
      supabase.from('continuity_groups').select('id,title,description').eq('project_id', projectId).order('created_at'),
      supabase.from('scenes').select('id,episode,scene_number,set_name,location,shoot_day_id,script_order').eq('project_id', projectId).order('script_order'),
      supabase.from('shoot_days').select('id,day_number,shoot_date').eq('project_id', projectId).order('shoot_date'),
      supabase.from('props').select('id,name,category').eq('project_id', projectId).order('name'),
    ])
    const error = groupsResult.error || scenesResult.error || daysResult.error || propsResult.error
    if (error) return setMessage(error.message)
    const groupRows = (groupsResult.data ?? []) as Group[]
    setGroups(groupRows)
    setScenes((scenesResult.data ?? []) as Scene[])
    setShootDays((daysResult.data ?? []) as ShootDay[])
    setProps((propsResult.data ?? []) as PropItem[])
    if (!activeGroupId && groupRows[0]) setActiveGroupId(groupRows[0].id)
  }

  async function loadGroup(groupId: string) {
    const [groupScenesResult, itemsResult, statesResult, mediaResult] = await Promise.all([
      supabase.from('continuity_group_scenes').select('group_id,scene_id,sort_order,notes,match_previous,change_reason').eq('group_id', groupId).order('sort_order'),
      supabase.from('continuity_items').select('id,project_id,group_id,prop_id,title,category,same_across_scenes,notes').eq('group_id', groupId).order('created_at'),
      supabase.from('continuity_item_states').select('id,item_id,scene_id,state_text,quantity,position_notes,condition_notes,intentional_change,change_reason').eq('project_id', projectId),
      supabase.from('media').select('id,scene_id,continuity_item_id,storage_path,file_name,caption,created_at').eq('project_id', projectId).eq('continuity_group_id', groupId).eq('kind', 'photo').order('created_at', { ascending: false }),
    ])
    const error = groupScenesResult.error || itemsResult.error || statesResult.error || mediaResult.error
    if (error) return setMessage(error.message)
    const itemRows = (itemsResult.data ?? []) as ContinuityItem[]
    const itemIds = new Set(itemRows.map((item) => item.id))
    setGroupScenes((groupScenesResult.data ?? []) as GroupScene[])
    setItems(itemRows)
    setStates(((statesResult.data ?? []) as ItemState[]).filter((state) => itemIds.has(state.item_id)))

    const mediaRows = (mediaResult.data ?? []) as MediaItem[]
    const withUrls = await Promise.all(mediaRows.map(async (item) => {
      const signed = await supabase.storage.from('project-files').createSignedUrl(item.storage_path, 60 * 60)
      return { ...item, signedUrl: signed.data?.signedUrl }
    }))
    setMedia(withUrls)
  }

  useEffect(() => { loadBase() }, [projectId])

  useEffect(() => {
    if (!activeGroupId) {
      setGroupScenes([]); setItems([]); setStates([]); setMedia([])
      return
    }
    loadGroup(activeGroupId)
    const channel = supabase
      .channel(`continuity-${activeGroupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'continuity_groups', filter: `project_id=eq.${projectId}` }, loadBase)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'continuity_group_scenes', filter: `group_id=eq.${activeGroupId}` }, () => loadGroup(activeGroupId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'continuity_items', filter: `project_id=eq.${projectId}` }, () => loadGroup(activeGroupId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'continuity_item_states', filter: `project_id=eq.${projectId}` }, () => loadGroup(activeGroupId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media', filter: `project_id=eq.${projectId}` }, () => loadGroup(activeGroupId))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId, activeGroupId])

  const chain = useMemo(() => groupScenes
    .map((link) => ({ ...link, scene: scenes.find((scene) => scene.id === link.scene_id) }))
    .filter((entry) => entry.scene), [groupScenes, scenes])

  const availableScenes = scenes.filter((scene) => !groupScenes.some((link) => link.scene_id === scene.id))

  const riskCells = useMemo(() => {
    const result = new Set<string>()
    for (const item of items) {
      if (!item.same_across_scenes) continue
      let previous: ItemState | undefined
      for (const entry of chain) {
        const current = states.find((state) => state.item_id === item.id && state.scene_id === entry.scene_id)
        if (!current || !stateSignature(current)) continue
        if (previous && stateSignature(previous) !== stateSignature(current) && !current.intentional_change) {
          result.add(`${item.id}:${entry.scene_id}`)
        }
        previous = current
      }
    }
    return result
  }, [items, states, chain])

  const riskItems = new Set([...riskCells].map((key) => key.split(':')[0])).size

  async function createGroup(e: FormEvent) {
    e.preventDefault()
    if (!newGroupTitle.trim()) return
    setBusy(true); setMessage('')
    const result = await supabase.from('continuity_groups').insert({ project_id: projectId, title: newGroupTitle.trim() }).select('id,title,description').single()
    if (result.error) setMessage(result.error.message)
    else {
      setNewGroupTitle('')
      setGroups((current) => [...current, result.data as Group])
      setActiveGroupId(result.data.id)
    }
    setBusy(false)
  }

  async function addScene() {
    if (!activeGroupId || !sceneToAdd) return
    const result = await supabase.from('continuity_group_scenes').insert({ group_id: activeGroupId, scene_id: sceneToAdd, sort_order: groupScenes.length })
    if (result.error) setMessage(result.error.message)
    else setSceneToAdd('')
  }

  async function removeScene(sceneId: string) {
    if (!activeGroupId) return
    const result = await supabase.from('continuity_group_scenes').delete().eq('group_id', activeGroupId).eq('scene_id', sceneId)
    if (result.error) setMessage(result.error.message)
  }

  async function createItem(e: FormEvent) {
    e.preventDefault()
    if (!activeGroupId) return
    const chosenProp = props.find((prop) => prop.id === propToAdd)
    const title = newItemTitle.trim() || chosenProp?.name || ''
    if (!title) return
    setBusy(true); setMessage('')
    const result = await supabase.from('continuity_items').insert({
      project_id: projectId,
      group_id: activeGroupId,
      prop_id: chosenProp?.id ?? null,
      title,
      category: chosenProp?.category || 'Деталь стыка',
      same_across_scenes: sameAcrossScenes,
    })
    if (result.error) setMessage(result.error.message)
    else {
      setNewItemTitle('')
      setPropToAdd('')
      setSameAcrossScenes(true)
    }
    setBusy(false)
  }

  async function deleteItem(itemId: string) {
    const result = await supabase.from('continuity_items').delete().eq('id', itemId)
    if (result.error) setMessage(result.error.message)
  }

  async function saveState(itemId: string, sceneId: string, patch: Partial<ItemState>) {
    const existing = states.find((state) => state.item_id === itemId && state.scene_id === sceneId)
    const payload = {
      project_id: projectId,
      item_id: itemId,
      scene_id: sceneId,
      state_text: existing?.state_text ?? '',
      quantity: existing?.quantity ?? 1,
      position_notes: existing?.position_notes ?? '',
      condition_notes: existing?.condition_notes ?? '',
      intentional_change: existing?.intentional_change ?? false,
      change_reason: existing?.change_reason ?? '',
      ...patch,
    }
    const result = await supabase.from('continuity_item_states').upsert(payload, { onConflict: 'item_id,scene_id' }).select('id,item_id,scene_id,state_text,quantity,position_notes,condition_notes,intentional_change,change_reason').single()
    if (result.error) return setMessage(result.error.message)
    setStates((current) => {
      const next = current.filter((state) => !(state.item_id === itemId && state.scene_id === sceneId))
      return [...next, result.data as ItemState]
    })
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>, item: ContinuityItem, sceneId: string) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !activeGroupId) return
    if (!file.type.startsWith('image/')) return setMessage('Для стыка выберите изображение.')
    if (file.size > 6 * 1024 * 1024) return setMessage('Фото больше 6 МБ.')

    setBusy(true); setMessage('')
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) { setBusy(false); return setMessage('Сессия закончилась. Войдите снова.') }

    const path = `${projectId}/continuity/${activeGroupId}/${item.id}/${sceneId}/${Date.now()}-${safeFileName(file.name)}`
    const uploaded = await supabase.storage.from('project-files').upload(path, file, { contentType: file.type, upsert: false })
    if (uploaded.error) { setBusy(false); return setMessage(uploaded.error.message) }

    const inserted = await supabase.from('media').insert({
      project_id: projectId,
      scene_id: sceneId,
      prop_id: item.prop_id,
      continuity_group_id: activeGroupId,
      continuity_item_id: item.id,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      kind: 'photo',
      caption: item.title,
      uploaded_by: userId,
    })
    if (inserted.error) {
      await supabase.storage.from('project-files').remove([path])
      setMessage(inserted.error.message)
    }
    setBusy(false)
  }

  function sceneLabel(scene: Scene) {
    const day = shootDays.find((item) => item.id === scene.shoot_day_id)
    return `${scene.episode ? `${scene.episode} · ` : ''}${scene.scene_number}${day ? ` · см.${day.day_number} ${dateLabel(day.shoot_date)}` : ''}`
  }

  return (
    <section className="continuity-board panel">
      <div className="continuity-head">
        <div><span className="eyebrow">CONTINUITY / СТЫКИ</span><h3>Цепочки между сценами</h3><p>Сравнивайте состояние предметов и деталей между сценами в одной таблице.</p></div>
        <div className={riskCells.size ? 'continuity-risk warn' : 'continuity-risk ok'}>
          {riskCells.size ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}<strong>{riskCells.size ? `${riskCells.size} расхожд.` : 'Расхождений нет'}</strong><span>{riskItems ? `${riskItems} элементов требуют проверки` : 'по заполненным состояниям'}</span>
        </div>
      </div>

      <div className="continuity-shell">
        <aside className="continuity-groups">
          <form onSubmit={createGroup} className="continuity-create-group">
            <input value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} placeholder="Новая цепочка: Квартира Кости"/>
            <button disabled={busy}><Plus size={16}/></button>
          </form>
          {groups.map((group) => (
            <button key={group.id} className={group.id === activeGroupId ? 'continuity-group active' : 'continuity-group'} onClick={() => setActiveGroupId(group.id)}>
              <span><strong>{group.title}</strong><small>{group.description || 'Цепочка сцен'}</small></span><ChevronRight size={15}/>
            </button>
          ))}
          {!groups.length && <div className="empty-inline">Создайте первую цепочку стыков.</div>}
        </aside>

        <div className="continuity-main">
          {!activeGroup ? <div className="continuity-empty">Создайте или выберите цепочку сцен.</div> : (
            <>
              <div className="continuity-group-toolbar">
                <div><h3>{activeGroup.title}</h3><p>{chain.length} сцен · {items.length} элементов</p></div>
                <div className="continuity-add-scene">
                  <select value={sceneToAdd} onChange={(e) => setSceneToAdd(e.target.value)}><option value="">Добавить сцену…</option>{availableScenes.map((scene) => <option key={scene.id} value={scene.id}>{sceneLabel(scene)}</option>)}</select>
                  <button className="compact-button" disabled={!sceneToAdd} onClick={addScene}><Link2 size={15}/> Добавить</button>
                </div>
              </div>

              <div className="continuity-chain">
                {chain.map((entry, index) => entry.scene && (
                  <div className="continuity-scene-chip" key={entry.scene_id}>
                    <span className="chain-index">{index + 1}</span><span><strong>Сцена {entry.scene.scene_number}</strong><small>{entry.scene.episode ? `${entry.scene.episode} серия · ` : ''}{entry.scene.set_name || entry.scene.location || 'без локации'}</small></span>
                    <button onClick={() => removeScene(entry.scene_id)} title="Убрать сцену"><Trash2 size={13}/></button>
                  </div>
                ))}
                {!chain.length && <div className="empty-inline">Добавьте минимум две сцены, которые должны стыковаться.</div>}
              </div>

              <form className="continuity-add-item" onSubmit={createItem}>
                <select value={propToAdd} onChange={(e) => setPropToAdd(e.target.value)}><option value="">Реквизит из базы (необязательно)…</option>{props.map((prop) => <option key={prop.id} value={prop.id}>{prop.name}</option>)}</select>
                <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Или деталь: уровень воды в бокале"/>
                <label><input type="checkbox" checked={sameAcrossScenes} onChange={(e) => setSameAcrossScenes(e.target.checked)}/> должно совпадать</label>
                <button className="compact-button" disabled={busy}><Plus size={15}/> Добавить элемент</button>
              </form>

              <div className="continuity-matrix-wrap">
                <table className="continuity-matrix">
                  <thead><tr><th className="continuity-item-col">Элемент стыка</th>{chain.map((entry) => <th key={entry.scene_id}>Сцена {entry.scene?.scene_number}<small>{entry.scene?.episode ? `${entry.scene.episode} серия` : ''}</small></th>)}</tr></thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="continuity-item-cell">
                          <div><strong>{item.title}</strong><small>{item.category}</small><span className={item.same_across_scenes ? 'same-badge' : 'progress-badge'}>{item.same_across_scenes ? 'должно совпадать' : 'может меняться'}</span></div>
                          <button onClick={() => deleteItem(item.id)} title="Удалить элемент"><Trash2 size={14}/></button>
                        </td>
                        {chain.map((entry) => {
                          const state = states.find((row) => row.item_id === item.id && row.scene_id === entry.scene_id)
                          const risky = riskCells.has(`${item.id}:${entry.scene_id}`)
                          const photos = media.filter((photo) => photo.continuity_item_id === item.id && photo.scene_id === entry.scene_id)
                          return (
                            <td key={entry.scene_id} className={risky ? 'continuity-state-cell risky' : 'continuity-state-cell'}>
                              {risky && <div className="cell-risk"><AlertTriangle size={13}/> отличается от предыдущей</div>}
                              <textarea defaultValue={state?.state_text ?? ''} placeholder="Состояние: открыт, 40%, разбит…" onBlur={(e) => saveState(item.id, entry.scene_id, { state_text: e.target.value })}/>
                              <input defaultValue={state?.position_notes ?? ''} placeholder="Положение / деталь" onBlur={(e) => saveState(item.id, entry.scene_id, { position_notes: e.target.value })}/>
                              <div className="continuity-cell-actions">
                                <label className={state?.intentional_change ? 'intentional checked' : 'intentional'}><input type="checkbox" checked={state?.intentional_change ?? false} onChange={(e) => saveState(item.id, entry.scene_id, { intentional_change: e.target.checked })}/> изм. по сценарию</label>
                                <label className="photo-upload-mini"><UploadCloud size={13}/><span>{photos.length ? photos.length : 'Фото'}</span><input type="file" accept="image/*" onChange={(e) => uploadPhoto(e, item, entry.scene_id)}/></label>
                              </div>
                              {state?.intentional_change && <input className="change-reason" defaultValue={state.change_reason} placeholder="Почему меняется" onBlur={(e) => saveState(item.id, entry.scene_id, { change_reason: e.target.value })}/>} 
                              {photos[0]?.signedUrl && <div className="continuity-thumb"><img src={photos[0].signedUrl} alt={item.title}/><Camera size={13}/></div>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    {!items.length && <tr><td colSpan={Math.max(2, chain.length + 1)} className="continuity-empty-row">Добавьте предмет или деталь, состояние которой нужно контролировать.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {message && <div className="notice continuity-notice">{message}</div>}
    </section>
  )
}
