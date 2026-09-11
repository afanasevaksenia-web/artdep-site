const SUPABASE_URL = "https://qnuysxrhoaguhyvtxgls.supabase.co";
const SUPABASE_KEY = "sb_publishable_EF9DoRgy4vJZ0CezkC2GLQ_nro5WLZ0";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const els = {
  authSection: document.getElementById("authSection"),
  appSection: document.getElementById("appSection"),
  userBar: document.getElementById("userBar"),
  userName: document.getElementById("userName"),
  logoutBtn: document.getElementById("logoutBtn"),

  authTitle: document.getElementById("authTitle"),
  authForm: document.getElementById("authForm"),
  fullNameInput: document.getElementById("fullNameInput"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  authSubmit: document.getElementById("authSubmit"),
  authError: document.getElementById("authError"),
  authInfo: document.getElementById("authInfo"),
  authToggle: document.getElementById("authToggle"),

  tabs: document.getElementById("tabs"),

  postForm: document.getElementById("postForm"),
  postContent: document.getElementById("postContent"),
  postList: document.getElementById("postList"),

  shiftForm: document.getElementById("shiftForm"),
  shiftTitle: document.getElementById("shiftTitle"),
  shiftLocation: document.getElementById("shiftLocation"),
  shiftStart: document.getElementById("shiftStart"),
  shiftEnd: document.getElementById("shiftEnd"),
  shiftNotes: document.getElementById("shiftNotes"),
  shiftList: document.getElementById("shiftList"),

  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskRole: document.getElementById("taskRole"),
  taskDescription: document.getElementById("taskDescription"),
  taskDueDate: document.getElementById("taskDueDate"),
  taskList: document.getElementById("taskList"),

  fileForm: document.getElementById("fileForm"),
  fileInput: document.getElementById("fileInput"),
  fileList: document.getElementById("fileList"),
};

let isSignUpMode = false;
let currentUser = null;

function showAuthError(message) {
  els.authError.textContent = message;
  els.authError.hidden = !message;
}

function showAuthInfo(message) {
  els.authInfo.textContent = message;
  els.authInfo.hidden = !message;
}

els.authToggle.addEventListener("click", () => {
  isSignUpMode = !isSignUpMode;
  els.fullNameInput.hidden = !isSignUpMode;
  els.fullNameInput.required = isSignUpMode;
  els.authTitle.textContent = isSignUpMode ? "Регистрация" : "Вход";
  els.authSubmit.textContent = isSignUpMode ? "Зарегистрироваться" : "Войти";
  els.authToggle.textContent = isSignUpMode ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться";
  showAuthError("");
  showAuthInfo("");
});

els.authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showAuthError("");
  showAuthInfo("");
  els.authSubmit.disabled = true;

  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;

  try {
    if (isSignUpMode) {
      const fullName = els.fullNameInput.value.trim();
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      showAuthInfo("Проверьте почту и подтвердите email, затем войдите.");
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) {
    showAuthError(err.message);
  } finally {
    els.authSubmit.disabled = false;
  }
});

els.logoutBtn.addEventListener("click", () => supabaseClient.auth.signOut());

els.tabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (!btn) return;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(btn.dataset.tab).classList.add("active");
});

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function loadPosts() {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("id, content, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    els.postList.innerHTML = `<li class="error">${escapeHtml(error.message)}</li>`;
    return;
  }

  els.postList.innerHTML = data
    .map(
      (post) => `
    <li class="item">
      <div class="item-meta">${escapeHtml(post.profiles?.full_name || "—")} · ${formatDateTime(post.created_at)}</div>
      <div>${escapeHtml(post.content)}</div>
    </li>`
    )
    .join("") || "<li class='empty'>Пока пусто</li>";
}

els.postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = els.postContent.value.trim();
  if (!content || !currentUser) return;

  const { error } = await supabaseClient.from("posts").insert({ author_id: currentUser.id, content });
  if (error) {
    alert(error.message);
    return;
  }
  els.postContent.value = "";
  loadPosts();
});

async function loadShifts() {
  const { data, error } = await supabaseClient
    .from("shifts")
    .select("id, title, location, starts_at, ends_at, notes, profiles(full_name)")
    .order("starts_at", { ascending: true });

  if (error) {
    els.shiftList.innerHTML = `<li class="error">${escapeHtml(error.message)}</li>`;
    return;
  }

  els.shiftList.innerHTML = data
    .map(
      (shift) => `
    <li class="item">
      <div class="item-title">${escapeHtml(shift.title)}</div>
      <div class="item-meta">${formatDateTime(shift.starts_at)}${shift.ends_at ? " – " + formatDateTime(shift.ends_at) : ""}</div>
      ${shift.location ? `<div>📍 ${escapeHtml(shift.location)}</div>` : ""}
      ${shift.notes ? `<div>${escapeHtml(shift.notes)}</div>` : ""}
      <div class="item-meta">Добавил: ${escapeHtml(shift.profiles?.full_name || "—")}</div>
    </li>`
    )
    .join("") || "<li class='empty'>Смен пока нет</li>";
}

els.shiftForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const { error } = await supabaseClient.from("shifts").insert({
    title: els.shiftTitle.value.trim(),
    location: els.shiftLocation.value.trim() || null,
    starts_at: new Date(els.shiftStart.value).toISOString(),
    ends_at: els.shiftEnd.value ? new Date(els.shiftEnd.value).toISOString() : null,
    notes: els.shiftNotes.value.trim() || null,
    created_by: currentUser.id,
  });

  if (error) {
    alert(error.message);
    return;
  }
  els.shiftForm.reset();
  loadShifts();
});

const TASK_STATUS_LABELS = { todo: "К выполнению", in_progress: "В работе", done: "Готово" };

async function loadTasks() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select(
      "id, title, description, role, status, due_date, creator:profiles!tasks_created_by_fkey(full_name), assignee:profiles!tasks_assignee_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    els.taskList.innerHTML = `<li class="error">${escapeHtml(error.message)}</li>`;
    return;
  }

  els.taskList.innerHTML = data
    .map((task) => {
      const options = Object.entries(TASK_STATUS_LABELS)
        .map(([value, label]) => `<option value="${value}" ${task.status === value ? "selected" : ""}>${label}</option>`)
        .join("");
      return `
    <li class="item" data-task-id="${task.id}">
      <div class="item-title">${escapeHtml(task.title)}${task.role ? ` <span class="tag">${escapeHtml(task.role)}</span>` : ""}</div>
      ${task.description ? `<div>${escapeHtml(task.description)}</div>` : ""}
      <div class="item-meta">
        ${task.due_date ? `Срок: ${escapeHtml(task.due_date)} · ` : ""}
        Автор: ${escapeHtml(task.creator?.full_name || "—")}
      </div>
      <label>Статус
        <select class="task-status">${options}</select>
      </label>
    </li>`;
    })
    .join("") || "<li class='empty'>Задач пока нет</li>";
}

els.taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const { error } = await supabaseClient.from("tasks").insert({
    title: els.taskTitle.value.trim(),
    role: els.taskRole.value.trim() || null,
    description: els.taskDescription.value.trim() || null,
    due_date: els.taskDueDate.value || null,
    assignee_id: currentUser.id,
    created_by: currentUser.id,
  });

  if (error) {
    alert(error.message);
    return;
  }
  els.taskForm.reset();
  loadTasks();
});

els.taskList.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("task-status")) return;
  const taskId = e.target.closest("[data-task-id]").dataset.taskId;
  const { error } = await supabaseClient.from("tasks").update({ status: e.target.value }).eq("id", taskId);
  if (error) alert(error.message);
});

async function loadFiles() {
  const { data, error } = await supabaseClient
    .from("files")
    .select("id, name, storage_path, created_at, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    els.fileList.innerHTML = `<li class="error">${escapeHtml(error.message)}</li>`;
    return;
  }

  const items = await Promise.all(
    data.map(async (file) => {
      const { data: signed } = await supabaseClient.storage
        .from("crew-files")
        .createSignedUrl(file.storage_path, 3600);
      const url = signed?.signedUrl || "#";
      return `
    <li class="item">
      <a href="${url}" target="_blank" rel="noopener">${escapeHtml(file.name)}</a>
      <div class="item-meta">${escapeHtml(file.profiles?.full_name || "—")} · ${formatDateTime(file.created_at)}</div>
    </li>`;
    })
  );

  els.fileList.innerHTML = items.join("") || "<li class='empty'>Файлов пока нет</li>";
}

els.fileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const file = els.fileInput.files[0];
  if (!file) return;

  const path = `${currentUser.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabaseClient.storage.from("crew-files").upload(path, file);
  if (uploadError) {
    alert(uploadError.message);
    return;
  }

  const { error: insertError } = await supabaseClient
    .from("files")
    .insert({ name: file.name, storage_path: path, uploaded_by: currentUser.id });
  if (insertError) {
    alert(insertError.message);
    return;
  }

  els.fileForm.reset();
  loadFiles();
});

async function loadAll() {
  loadPosts();
  loadShifts();
  loadTasks();
  loadFiles();
}

async function showApp(user) {
  currentUser = user;
  els.authSection.hidden = true;
  els.appSection.hidden = false;
  els.userBar.hidden = false;

  const { data: profile } = await supabaseClient.from("profiles").select("full_name").eq("id", user.id).single();
  els.userName.textContent = profile?.full_name || user.email;

  loadAll();
}

function showAuth() {
  currentUser = null;
  els.authSection.hidden = false;
  els.appSection.hidden = true;
  els.userBar.hidden = true;
  els.authForm.reset();
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    showApp(session.user);
  } else {
    showAuth();
  }
});

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session?.user) showApp(data.session.user);
});
