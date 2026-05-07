const API_URL = '/api/tasks';

// ── helpers ───────────────────────────────────────────────────────────────
const N = {
  urgencyLevel(task, now = Date.now()) {
    if (task.dueAt === null) {
      if (task.priority === 'critical') return 'critical';
      if (task.priority === 'high') return 'warning';
      return 'ok';
    }
    const ms = task.dueAt - now;
    if (ms < 0) return 'overdue';
    if (ms < 15 * 60_000 || task.priority === 'critical') return 'critical';
    if (ms < 60 * 60_000 || task.priority === 'high') return 'warning';
    return 'ok';
  },

  formatDueLabel(task) {
    if (task.dueAt === null) return 'Sem prazo';
    const ms = task.dueAt - Date.now();
    if (ms < 0) return 'ATRASADA';
    const min = Math.round(ms / 60_000);
    if (min < 60) return `em ${min} min`;
    const h = Math.floor(min / 60);
    const rem = min % 60;
    if (h < 24) return rem ? `em ${h}h${rem.toString().padStart(2, '0')}` : `em ${h}h`;
    return `em ${Math.floor(h / 24)}d`;
  },

  formatCountdown(ms) {
    if (ms === null) return '–';
    const sign = ms < 0 ? '-' : '';
    const abs = Math.abs(ms);
    const totalSec = Math.floor(abs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const p = n => n.toString().padStart(2, '0');
    return h > 0 ? `${sign}${h}:${p(m)}:${p(s)}` : `${sign}${p(m)}:${p(s)}`;
  },

  priorityLabel: { critical: 'CRÍTICA', high: 'ALTA', normal: 'NORMAL', low: 'BAIXA' },
  statusLabel: { pending: 'PENDENTE', in_progress: 'EM ANDAMENTO', done: 'CONCLUÍDA' },
};

function adaptTask(t) {
  return {
    id: t.id,
    title: t.title || '',
    description: t.description || '',
    priority: t.priority,
    status: t.status,
    dueAt: t.deadline ? new Date(t.deadline).getTime() : null,
    done_at: t.done_at ? new Date(t.done_at).getTime() : null,
    has_timer: t.has_timer,
    timer_duration_minutes: t.timer_duration_minutes,
    timer_started_at: t.timer_started_at,
    _deadline_raw: t.deadline || '',
  };
}

function esc(s) {
  return (s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function urgencyOrder(t) {
  const u = N.urgencyLevel(t);
  const ms = t.dueAt !== null ? t.dueAt - Date.now() : Infinity;
  return { overdue: 0, critical: 1, warning: 2, ok: 3 }[u] * 1_000_000 + ms / 1000;
}

function pad(n) { return n.toString().padStart(2, '0'); }

function toLocalDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowMySQL() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ── state ─────────────────────────────────────────────────────────────────
let tasks = [];
let selectedId = null;
let navFilter = 'active';
let urgencyFilter = 'all';
let searchQuery = '';

// ── load ──────────────────────────────────────────────────────────────────
async function loadTasks() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) return;
    tasks = (await res.json()).map(adaptTask);
    renderList();
    updateNavCounts();
    if (selectedId !== null) {
      const t = tasks.find(x => x.id === selectedId);
      if (t) populatePanel(t);
    }
  } catch (e) {
    console.error('load failed', e);
  }
}

// ── list ──────────────────────────────────────────────────────────────────
function filteredTasks() {
  let list = [...tasks];

  // nav filter
  if (navFilter === 'active')      list = list.filter(t => t.status !== 'done');
  else if (navFilter === 'in_progress') list = list.filter(t => t.status === 'in_progress');
  else if (navFilter === 'done')   list = list.filter(t => t.status === 'done');

  // urgency filter
  if (urgencyFilter !== 'all') list = list.filter(t => N.urgencyLevel(t) === urgencyFilter);

  // search
  if (searchQuery) list = list.filter(t => t.title.toLowerCase().includes(searchQuery));

  return list.sort((a, b) => urgencyOrder(a) - urgencyOrder(b));
}

function renderList() {
  const rows = filteredTasks();
  const titles = {
    active: 'TAREFAS ATIVAS', in_progress: 'EM ANDAMENTO',
    done: 'CONCLUÍDAS', all: 'TODAS AS TAREFAS',
  };
  document.getElementById('list-title').textContent = titles[navFilter] || 'TAREFAS';

  const overdue = rows.filter(t => t.dueAt !== null && t.dueAt < Date.now() && t.status !== 'done').length;
  document.getElementById('list-sub').textContent =
    `${rows.length} tarefa${rows.length !== 1 ? 's' : ''}`
    + (overdue ? ` · ${overdue} atrasada${overdue !== 1 ? 's' : ''}` : '')
    + ' · ordenado por urgência';

  document.getElementById('list-rows').innerHTML = rows.map(renderRow).join('');
}

function renderRow(t) {
  const u = N.urgencyLevel(t);
  const isDone = t.status === 'done';
  const isSelected = t.id === selectedId;
  const dueLabel = isDone ? N.statusLabel.done : (u === 'overdue'
    ? N.formatCountdown(t.dueAt !== null ? t.dueAt - Date.now() : null)
    : N.formatDueLabel(t));
  return `
    <div class="task-row urgency-${u}${isSelected ? ' selected' : ''}" data-id="${t.id}" onclick="selectTask(${t.id})">
      <span class="row-stripe"></span>
      <span class="row-checkbox${isDone ? ' done' : ''}" onclick="event.stopPropagation();toggleDone(${t.id})">${isDone ? '✓' : ''}</span>
      <div class="row-main">
        <div class="row-title${isDone ? ' is-done' : ''}">${esc(t.title)}</div>
        <div class="row-meta">
          <span class="pri ${t.priority}">${N.priorityLabel[t.priority]}</span>
          <span>·</span>
          <span>${N.statusLabel[t.status]}</span>
        </div>
      </div>
      <div class="row-due ${u}">${esc(dueLabel)}</div>
    </div>`;
}

function updateNavCounts() {
  document.getElementById('nav-count-active').textContent   = tasks.filter(t => t.status !== 'done').length;
  document.getElementById('nav-count-progress').textContent = tasks.filter(t => t.status === 'in_progress').length;
  document.getElementById('nav-count-done').textContent     = tasks.filter(t => t.status === 'done').length;
}

// ── selection ─────────────────────────────────────────────────────────────
function selectTask(id) {
  selectedId = id;
  const t = tasks.find(x => x.id === id);
  if (t) populatePanel(t);
  renderList();
}

async function toggleDone(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const newStatus = t.status === 'done' ? 'pending' : 'done';
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  await loadTasks();
}

// ── edit panel ────────────────────────────────────────────────────────────
function populatePanel(t) {
  const u = N.urgencyLevel(t);
  const timerActive = t.has_timer && t.timer_started_at;
  const timerStatusTxt = timerActive
    ? `Iniciado em ${new Date(t.timer_started_at).toLocaleString('pt-BR')}`
    : 'Não iniciado';

  const panelHtml = `
    <div class="edit-header">
      <h2>${t ? `TAREFA · #${t.id}` : 'NOVA TAREFA'}</h2>
      <div style="display:flex;gap:6px">
        <button class="icon-btn danger" id="btn-delete" title="Excluir">
          <svg class="ico" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
    <div class="edit-body">
      <div class="field title">
        <label>Título</label>
        <input type="text" name="title" maxlength="120" value="${esc(t.title)}">
      </div>
      <div class="field">
        <label>Descrição</label>
        <textarea name="description" maxlength="300">${esc(t.description)}</textarea>
      </div>
      <div class="field">
        <label>Prioridade</label>
        <div class="priority-group">
          <input type="radio" name="pri" id="pri-c" value="critical" ${t.priority==='critical'?'checked':''}>
          <label for="pri-c" data-p="critical">CRÍTICA</label>
          <input type="radio" name="pri" id="pri-h" value="high" ${t.priority==='high'?'checked':''}>
          <label for="pri-h" data-p="high">ALTA</label>
          <input type="radio" name="pri" id="pri-n" value="normal" ${t.priority==='normal'?'checked':''}>
          <label for="pri-n" data-p="normal">NORMAL</label>
          <input type="radio" name="pri" id="pri-l" value="low" ${t.priority==='low'?'checked':''}>
          <label for="pri-l" data-p="low">BAIXA</label>
        </div>
      </div>
      <div class="split">
        <div class="field">
          <label>Status</label>
          <select name="status">
            <option value="pending" ${t.status==='pending'?'selected':''}>Pendente</option>
            <option value="in_progress" ${t.status==='in_progress'?'selected':''}>Em andamento</option>
            <option value="done" ${t.status==='done'?'selected':''}>Concluída</option>
          </select>
        </div>
        <div class="field">
          <label>Prazo</label>
          <input type="datetime-local" name="deadline" value="${toLocalDateTime(t._deadline_raw)}">
        </div>
      </div>
      <div class="field">
        <div class="field-label">Cronômetro</div>
        <label class="timer-toggle">
          <input type="checkbox" name="has_timer" id="cb-timer" ${t.has_timer ? 'checked' : ''}>
          Ativar cronômetro
        </label>
        <div class="timer-subfields" id="timer-fields" ${t.has_timer ? '' : 'hidden'}>
          <div class="field" style="margin:0">
            <label>Duração (minutos)</label>
            <input type="number" name="timer_duration_minutes" min="1" value="${t.timer_duration_minutes || ''}">
          </div>
          <div class="timer-controls">
            <button class="btn" id="btn-timer-start">Iniciar</button>
            <button class="btn" id="btn-timer-stop">Parar</button>
            <span id="timer-status-txt">${timerStatusTxt}</span>
          </div>
        </div>
      </div>
      <div style="margin-bottom:18px">
        <span class="tv-preview-link">
          <svg class="ico" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <b>Visível na TV</b> · urgência <b style="color:var(--u-${u})">${u.toUpperCase()}</b> · ${N.formatDueLabel(t)}
        </span>
      </div>
    </div>
    <div class="edit-actions">
      <button class="btn btn-success" id="btn-done">✓ Marcar concluída</button>
      <div style="display:flex;gap:8px">
        <button class="btn" id="btn-cancel">Cancelar</button>
        <button class="btn btn-primary" id="btn-save">Salvar</button>
      </div>
    </div>`;

  document.getElementById('edit-panel').innerHTML = panelHtml;
}

function showNewForm() {
  selectedId = null;
  renderList();
  const panelHtml = `
    <div class="edit-header">
      <h2>NOVA TAREFA</h2>
    </div>
    <div class="edit-body">
      <div class="field title">
        <label>Título</label>
        <input type="text" name="title" maxlength="120" placeholder="Descreva a tarefa…">
      </div>
      <div class="field">
        <label>Descrição</label>
        <textarea name="description" maxlength="300" placeholder="Detalhes opcionais…"></textarea>
      </div>
      <div class="field">
        <label>Prioridade</label>
        <div class="priority-group">
          <input type="radio" name="pri" id="pri-c" value="critical"><label for="pri-c" data-p="critical">CRÍTICA</label>
          <input type="radio" name="pri" id="pri-h" value="high"><label for="pri-h" data-p="high">ALTA</label>
          <input type="radio" name="pri" id="pri-n" value="normal" checked><label for="pri-n" data-p="normal">NORMAL</label>
          <input type="radio" name="pri" id="pri-l" value="low"><label for="pri-l" data-p="low">BAIXA</label>
        </div>
      </div>
      <div class="split">
        <div class="field">
          <label>Status</label>
          <select name="status">
            <option value="pending" selected>Pendente</option>
            <option value="in_progress">Em andamento</option>
            <option value="done">Concluída</option>
          </select>
        </div>
        <div class="field">
          <label>Prazo</label>
          <input type="datetime-local" name="deadline">
        </div>
      </div>
    </div>
    <div class="edit-actions">
      <div></div>
      <div style="display:flex;gap:8px">
        <button class="btn" id="btn-cancel">Cancelar</button>
        <button class="btn btn-primary" id="btn-save">Criar tarefa</button>
      </div>
    </div>`;
  document.getElementById('edit-panel').innerHTML = panelHtml;
  document.querySelector('[name=title]')?.focus();
}

function clearPanel() {
  selectedId = null;
  document.getElementById('edit-panel').innerHTML =
    '<div style="padding:60px 24px;color:var(--fg-3);text-align:center">Selecione uma tarefa ou crie uma nova.</div>';
  renderList();
}

// ── panel read helpers ────────────────────────────────────────────────────
function panelData() {
  const panel = document.getElementById('edit-panel');
  const get = (sel) => panel.querySelector(sel);
  const title = (get('[name=title]')?.value || '').trim();
  const description = (get('[name=description]')?.value || '').trim() || null;
  const priority = get('[name=pri]:checked')?.value || 'normal';
  const status = get('[name=status]')?.value || 'pending';
  const deadlineRaw = get('[name=deadline]')?.value || '';
  const deadline = deadlineRaw ? deadlineRaw.replace('T', ' ') + ':00' : null;
  const has_timer = get('[name=has_timer]')?.checked || false;
  const timer_duration_minutes = has_timer && get('[name=timer_duration_minutes]')?.value
    ? parseInt(get('[name=timer_duration_minutes]').value, 10) : null;
  return { title, description, priority, status, deadline, has_timer, timer_duration_minutes };
}

// ── panel event delegation ────────────────────────────────────────────────
document.getElementById('edit-panel').addEventListener('click', async (e) => {
  const panel = document.getElementById('edit-panel');

  if (e.target.closest('#btn-save')) {
    const data = panelData();
    if (!data.title) { alert('O título é obrigatório.'); return; }
    if (!data.has_timer) { data.timer_duration_minutes = null; data.timer_started_at = null; }
    let res;
    if (selectedId !== null) {
      res = await fetch(`${API_URL}/${selectedId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } else {
      res = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) { const j = await res.json(); selectedId = j.id; }
    }
    if (!res.ok) { alert('Erro ao salvar.'); return; }
    await loadTasks();
    const t = tasks.find(x => x.id === selectedId);
    if (t) populatePanel(t);
    return;
  }

  if (e.target.closest('#btn-delete')) {
    if (!selectedId || !confirm('Deletar esta tarefa? Esta ação não pode ser desfeita.')) return;
    const res = await fetch(`${API_URL}/${selectedId}`, { method: 'DELETE' });
    if (!res.ok) { alert('Erro ao deletar.'); return; }
    clearPanel();
    await loadTasks();
    return;
  }

  if (e.target.closest('#btn-done')) {
    if (!selectedId) return;
    await fetch(`${API_URL}/${selectedId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    await loadTasks();
    const t = tasks.find(x => x.id === selectedId);
    if (t) populatePanel(t);
    return;
  }

  if (e.target.closest('#btn-cancel')) {
    clearPanel();
    return;
  }

  if (e.target.closest('#btn-timer-start')) {
    if (!selectedId) { alert('Salve a tarefa antes de iniciar o cronômetro.'); return; }
    const dur = parseInt(panel.querySelector('[name=timer_duration_minutes]')?.value || '0', 10);
    if (!dur || dur < 1) { alert('Informe a duração em minutos.'); return; }
    await fetch(`${API_URL}/${selectedId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ has_timer: true, timer_duration_minutes: dur, timer_started_at: nowMySQL() }),
    });
    await loadTasks();
    const t = tasks.find(x => x.id === selectedId);
    if (t) populatePanel(t);
    return;
  }

  if (e.target.closest('#btn-timer-stop')) {
    if (!selectedId) return;
    await fetch(`${API_URL}/${selectedId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timer_started_at: null }),
    });
    await loadTasks();
    const t = tasks.find(x => x.id === selectedId);
    if (t) populatePanel(t);
    return;
  }
});

document.getElementById('edit-panel').addEventListener('change', (e) => {
  if (e.target.name === 'has_timer') {
    const tf = document.getElementById('timer-fields');
    if (tf) tf.hidden = !e.target.checked;
  }
});

// ── nav / filter bindings ─────────────────────────────────────────────────
document.querySelectorAll('.nav-item[data-filter]').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item[data-filter]').forEach(x => x.classList.remove('active'));
    item.classList.add('active');
    navFilter = item.dataset.filter;
    renderList();
  });
});

document.getElementById('nav-preview').addEventListener('click', () => {
  window.open('/display', '_blank');
});

document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    urgencyFilter = pill.dataset.urgency;
    renderList();
  });
});

document.getElementById('search-input').addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderList();
});

document.getElementById('btn-new').addEventListener('click', showNewForm);

// ── init ──────────────────────────────────────────────────────────────────
setInterval(loadTasks, 10_000);
loadTasks();

// expose for inline onclick handlers
window.selectTask = selectTask;
window.toggleDone = toggleDone;
