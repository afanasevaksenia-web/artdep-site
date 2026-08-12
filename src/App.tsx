import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckSquare, Clapperboard, LogOut, Package, Plus, Users } from 'lucide-react'
import KppImport from './components/KppImport'
import { supabase } from './lib/supabase'

type Project = { id: string; name: string; description: string; total_budget: number; currency: string }
type Scene = { id: string; scene_number: string; location: string; time_of_day: string; status: string; description: string }
type Prop = { id: string; name: string; category: string; quantity: number; readiness: string; acquisition_type: string; storage_location: string; actual_cost: number }
type Task = { id: string; title: string; status: string; priority: string; due_at: string | null }

const tabs = [
  ['overview', 'Обзор'],
  ['kpp', 'КПП'],
  ['scenes', 'Сцены'],
  ['props', 'Реквизит'],
  ['tasks', 'Задания'],
] as const

type Tab = (typeof tabs)[number][0]

export default function App() {
  const [sessionReady, setSessionReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('')

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [newProject, setNewProject] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [props, setProps] = useState<Prop[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sceneForm, setSceneForm] = useState({ scene_number: '', location: '', time_of_day: 'День' })
  const [propForm, setPropForm] = useState({ name: '', category: 'Реквизит', acquisition_type: 'purchase' })
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'normal' })

  const activeProject = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null)
      setSessionReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setSessionReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) return
    loadProjects()
  }, [userId])

  useEffect(() => {
    if (!projectId) return
    loadProjectData(projectId)
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    const channel = supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scenes', filter: `project_id=eq.${projectId}` }, () => loadScenes(projectId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'props', filter: `project_id=eq.${projectId}` }, () => loadProps(projectId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, () => loadTasks(projectId))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId])

  async function signIn(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (authMode === 'signup') setMessage('Регистрация создана. Если включено подтверждение email — проверьте почту.')
  }

  async function loadProjects() {
    const { data, error } = await supabase.from('projects').select('id,name,description,total_budget,currency').order('created_at', { ascending: false })
    if (error) return setMessage(error.message)
    const list = (data ?? []) as Project[]
    setProjects(list)
    if (!projectId && list[0]) setProjectId(list[0].id)
  }

  async function createProject(e: FormEvent) {
    e.preventDefault()
    if (!newProject.trim()) return
    const { data, error } = await supabase.from('projects').insert({ name: newProject.trim() }).select('id,name,description,total_budget,currency').single()
    if (error) return setMessage(error.message)
    setNewProject('')
    setProjects((p) => [data as Project, ...p])
    setProjectId(data.id)
  }

  async function loadProjectData(id: string) {
    await Promise.all([loadScenes(id), loadProps(id), loadTasks(id)])
  }
  async function loadScenes(id: string) {
    const { data } = await supabase.from('scenes').select('id,scene_number,location,time_of_day,status,description').eq('project_id', id).order('script_order', { ascending: true })
    setScenes((data ?? []) as Scene[])
  }
  async function loadProps(id: string) {
    const { data } = await supabase.from('props').select('id,name,category,quantity,readiness,acquisition_type,storage_location,actual_cost').eq('project_id', id).order('created_at', { ascending: false })
    setProps((data ?? []) as Prop[])
  }
  async function loadTasks(id: string) {
    const { data } = await supabase.from('tasks').select('id,title,status,priority,due_at').eq('project_id', id).order('created_at', { ascending: false })
    setTasks((data ?? []) as Task[])
  }

  async function addScene(e: FormEvent) {
    e.preventDefault(); if (!projectId || !sceneForm.scene_number.trim()) return
    const { error } = await supabase.from('scenes').insert({ project_id: projectId, ...sceneForm })
    if (error) setMessage(error.message); else setSceneForm({ scene_number: '', location: '', time_of_day: 'День' })
  }
  async function addProp(e: FormEvent) {
    e.preventDefault(); if (!projectId || !propForm.name.trim()) return
    const { error } = await supabase.from('props').insert({ project_id: projectId, ...propForm })
    if (error) setMessage(error.message); else setPropForm({ name: '', category: 'Реквизит', acquisition_type: 'purchase' })
  }
  async function addTask(e: FormEvent) {
    e.preventDefault(); if (!projectId || !taskForm.title.trim()) return
    const { error } = await supabase.from('tasks').insert({ project_id: projectId, ...taskForm })
    if (error) setMessage(error.message); else setTaskForm({ title: '', priority: 'normal' })
  }

  if (!sessionReady) return <div className="screen-center">Подключение к базе…</div>

  if (!userId) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="brand-mark"><Clapperboard size={24}/></div>
          <h1>Реквизитный цех</h1>
          <p>КПП, сцены, реквизит, задания и бюджет в одной рабочей базе.</p>
          <form onSubmit={signIn} className="stack">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            <button className="primary">{authMode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
          </form>
          <button className="link-button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
            {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
          {message && <div className="notice">{message}</div>}
        </div>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><Clapperboard size={22}/><strong>Реквизитный цех</strong></div>
        <div className="sidebar-section-title">Проекты</div>
        <div className="project-list">
          {projects.map((p) => <button key={p.id} className={p.id === projectId ? 'project-button active' : 'project-button'} onClick={() => setProjectId(p.id)}>{p.name}</button>)}
        </div>
        <form onSubmit={createProject} className="new-project-form">
          <input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="Новый проект" />
          <button aria-label="Создать проект"><Plus size={18}/></button>
        </form>
        <button className="signout" onClick={() => supabase.auth.signOut()}><LogOut size={17}/> Выйти</button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">ТЕКУЩИЙ ПРОЕКТ</div>
            <h2>{activeProject?.name ?? 'Создайте проект'}</h2>
          </div>
          <div className="budget-pill">Бюджет: {(activeProject?.total_budget ?? 0).toLocaleString('ru-RU')} {activeProject?.currency ?? 'RUB'}</div>
        </header>

        <nav className="tabs">
          {tabs.map(([key, label]) => <button key={key} className={tab === key ? 'tab active' : 'tab'} onClick={() => setTab(key)}>{label}</button>)}
        </nav>

        {message && <div className="notice wide">{message}</div>}
        {!projectId ? <Empty icon={<Clapperboard/>} title="Создайте первый проект" text="После этого можно загрузить КПП, добавить реквизит и задания." /> : null}

        {projectId && tab === 'overview' && (
          <section className="content-grid">
            <Stat icon={<CalendarDays/>} label="Сцен" value={scenes.length} />
            <Stat icon={<Package/>} label="Позиций реквизита" value={props.length} />
            <Stat icon={<CheckSquare/>} label="Открытых заданий" value={tasks.filter(t => t.status !== 'done').length} />
            <Stat icon={<Users/>} label="Готово реквизита" value={props.filter(p => p.readiness === 'ready').length} />
            <div className="panel span-2">
              <h3>Последние позиции реквизита</h3>
              <DataList items={props.slice(0, 6).map(p => ({ title: p.name, meta: `${p.category} · ${p.readiness}` }))} empty="Реквизит ещё не добавлен" />
            </div>
            <div className="panel span-2">
              <h3>Ближайшие задачи</h3>
              <DataList items={tasks.slice(0, 6).map(t => ({ title: t.title, meta: `${t.priority} · ${t.status}` }))} empty="Задач пока нет" />
            </div>
          </section>
        )}

        {projectId && tab === 'kpp' && <KppImport projectId={projectId} onImported={() => loadProjectData(projectId)} />}

        {projectId && tab === 'scenes' && (
          <section className="panel">
            <div className="panel-head"><div><h3>Сцены КПП</h3><p>Номер сцены, локация, время суток и готовность.</p></div></div>
            <form onSubmit={addScene} className="inline-form">
              <input placeholder="№ сцены" value={sceneForm.scene_number} onChange={e => setSceneForm({...sceneForm, scene_number:e.target.value})}/>
              <input placeholder="Локация" value={sceneForm.location} onChange={e => setSceneForm({...sceneForm, location:e.target.value})}/>
              <select value={sceneForm.time_of_day} onChange={e => setSceneForm({...sceneForm, time_of_day:e.target.value})}><option>День</option><option>Ночь</option><option>Утро</option><option>Вечер</option></select>
              <button className="primary">Добавить</button>
            </form>
            <table><thead><tr><th>Сцена</th><th>Локация</th><th>Время</th><th>Статус</th></tr></thead><tbody>{scenes.map(s=><tr key={s.id}><td><strong>{s.scene_number}</strong></td><td>{s.location || '—'}</td><td>{s.time_of_day}</td><td><span className="status">{s.status}</span></td></tr>)}</tbody></table>
          </section>
        )}

        {projectId && tab === 'props' && (
          <section className="panel">
            <div className="panel-head"><div><h3>Общий список реквизита</h3><p>Готовность, способ получения, хранение и стоимость.</p></div></div>
            <form onSubmit={addProp} className="inline-form">
              <input placeholder="Название" value={propForm.name} onChange={e=>setPropForm({...propForm,name:e.target.value})}/>
              <input placeholder="Категория" value={propForm.category} onChange={e=>setPropForm({...propForm,category:e.target.value})}/>
              <select value={propForm.acquisition_type} onChange={e=>setPropForm({...propForm,acquisition_type:e.target.value})}><option value="purchase">Покупка</option><option value="rental">Аренда</option><option value="make">Изготовление</option><option value="stock">Со склада</option></select>
              <button className="primary">Добавить</button>
            </form>
            <table><thead><tr><th>Название</th><th>Категория</th><th>Кол-во</th><th>Готовность</th><th>Получение</th></tr></thead><tbody>{props.map(p=><tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{p.quantity}</td><td><span className="status">{p.readiness}</span></td><td>{p.acquisition_type}</td></tr>)}</tbody></table>
          </section>
        )}

        {projectId && tab === 'tasks' && (
          <section className="panel">
            <div className="panel-head"><div><h3>Задания цеху</h3><p>Подготовка реквизита, закупки, аренды и возвраты.</p></div></div>
            <form onSubmit={addTask} className="inline-form">
              <input placeholder="Что нужно сделать" value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})}/>
              <select value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}><option value="low">Низкий</option><option value="normal">Обычный</option><option value="high">Высокий</option><option value="urgent">Срочно</option></select>
              <button className="primary">Добавить</button>
            </form>
            <table><thead><tr><th>Задание</th><th>Приоритет</th><th>Статус</th><th>Срок</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><strong>{t.title}</strong></td><td>{t.priority}</td><td><span className="status">{t.status}</span></td><td>{t.due_at ? new Date(t.due_at).toLocaleString('ru-RU') : '—'}</td></tr>)}</tbody></table>
          </section>
        )}
      </main>
    </div>
  )
}

function Stat({icon,label,value}:{icon:React.ReactNode,label:string,value:number}) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div> }
function DataList({items,empty}:{items:{title:string,meta:string}[],empty:string}) { return <div className="data-list">{items.length ? items.map((i,n)=><div className="data-row" key={n}><div><strong>{i.title}</strong><span>{i.meta}</span></div></div>) : <div className="empty-small">{empty}</div>}</div> }
function Empty({icon,title,text}:{icon:React.ReactNode,title:string,text:string}) { return <div className="empty-state"><div>{icon}</div><h3>{title}</h3><p>{text}</p></div> }
