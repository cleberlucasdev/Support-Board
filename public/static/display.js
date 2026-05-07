const API_URL = '/api/tasks';
const POLL_MS = 10_000;
const DONE_TTL = 30 * 60_000;

// ── helpers ───────────────────────────────────────────────────────────────
const N = {
  msRemaining(task, now = Date.now()) {
    return task.dueAt !== null ? task.dueAt - now : null;
  },

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
  };
}

function esc(s) {
  return (s || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── state ─────────────────────────────────────────────────────────────────
let tasks = [];

function urgencyOrder(t) {
  const mult = { critical: 4, high: 2, normal: 1, low: 0.5 }[t.priority] || 1;
  if (t.dueAt === null) {
    // No deadline: strict priority order, always after any task with a deadline
    return 1e9 + { critical: 0, high: 1, normal: 2, low: 3 }[t.priority] * 1e6;
  }
  const sec = (t.dueAt - Date.now()) / 1000;
  if (sec < 0) return sec; // overdue: most negative = most urgent
  return sec / mult;       // effective time: lower = more urgent
}

function openTasks() {
  const now = Date.now();
  return tasks
    .filter(t => {
      if (t.status === 'done') {
        return t.done_at !== null && (now - t.done_at) < DONE_TTL;
      }
      return true;
    })
    .filter(t => t.status !== 'done')
    .sort((a, b) => urgencyOrder(a) - urgencyOrder(b));
}

// ── renderers ─────────────────────────────────────────────────────────────
function renderFeatured(task) {
  const ms = N.msRemaining(task);
  const u = N.urgencyLevel(task);
  const isOverdue = u === 'overdue';
  const lbl = isOverdue ? 'ATRASADA' : (task.dueAt !== null ? 'PRAZO RESTANTE' : '');
  return `
    <article class="task-card featured${isOverdue ? ' overdue' : ''}" data-id="${task.id}">
      <svg class="arc-bg" viewBox="0 0 800 200" preserveAspectRatio="none">
        <path d="M -50 280 A 320 320 0 0 1 320 -40" fill="none" stroke="rgba(255,26,42,0.18)" stroke-width="1.5"/>
        <path d="M -50 360 A 420 420 0 0 1 420 -80" fill="none" stroke="rgba(255,26,42,0.12)" stroke-width="1.5"/>
        <path d="M -50 440 A 520 520 0 0 1 520 -120" fill="none" stroke="rgba(255,26,42,0.08)" stroke-width="1.5"/>
      </svg>
      <div class="content">
        <div class="meta-row">
          <span class="priority-chip ${task.priority}">${N.priorityLabel[task.priority]}</span>
          <span class="status-meta">
            <span class="status-dot ${task.status}"></span>${N.statusLabel[task.status]}
          </span>
        </div>
        <h2>${esc(task.title)}</h2>
        ${task.description ? `<p>${esc(task.description)}</p>` : ''}
      </div>
      <div class="countdown-big ${u}">
        ${lbl ? `<span class="lbl">${lbl}</span>` : ''}
        <span class="time"${task.dueAt !== null ? ` data-due="${task.dueAt}"` : ''}>${N.formatCountdown(ms)}</span>
      </div>
    </article>`;
}

function renderCard(task) {
  const ms = N.msRemaining(task);
  const u = N.urgencyLevel(task);
  return `
    <article class="task-card urgency-${u}" data-id="${task.id}">
      <span class="left-stripe"></span>
      <div class="meta-row">
        <span class="priority-chip ${task.priority}">${N.priorityLabel[task.priority]}</span>
      </div>
      <h3>${esc(task.title)}</h3>
      ${task.description ? `<p class="card-desc">${esc(task.description)}</p>` : ''}
      <div class="countdown-row">
        <div class="countdown-mid ${u}"${task.dueAt !== null ? ` data-due="${task.dueAt}"` : ''}>${N.formatCountdown(ms)}</div>
      </div>
      <div class="footer">
        <span><span class="status-dot ${task.status}"></span>${N.statusLabel[task.status]}</span>
      </div>
    </article>`;
}

// ── render ────────────────────────────────────────────────────────────────
function render() {
  const open = openTasks();
  const featured = open.slice(0, 2);
  const rest = open.slice(2, 14);

  document.getElementById('featured-row').innerHTML = featured.map(renderFeatured).join('');
  document.getElementById('grid-row').innerHTML = rest.map(renderCard).join('');

  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  document.getElementById('kpi-overdue').textContent =
    open.filter(t => t.dueAt !== null && t.dueAt < now).length;
  document.getElementById('kpi-critical').textContent =
    open.filter(t => N.urgencyLevel(t) === 'critical').length;
  document.getElementById('kpi-warning').textContent =
    open.filter(t => N.urgencyLevel(t) === 'warning').length;
  document.getElementById('kpi-progress').textContent =
    tasks.filter(t => t.status === 'in_progress').length;
  document.getElementById('kpi-done').textContent =
    tasks.filter(t => t.status === 'done' && t.done_at !== null && t.done_at >= todayStart.getTime()).length;
}

// ── tickers ───────────────────────────────────────────────────────────────
function tickCountdowns() {
  const now = Date.now();
  document.querySelectorAll('[data-due]').forEach(el => {
    el.textContent = N.formatCountdown(+el.dataset.due - now);
  });
}

function tickClock() {
  const d = new Date();
  const p = n => n.toString().padStart(2, '0');
  document.getElementById('clock-time').textContent =
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  const days   = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
  const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  document.getElementById('clock-date').textContent =
    `${days[d.getDay()]} · ${p(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ── fetch ─────────────────────────────────────────────────────────────────
async function fetchTasks() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) return;
    tasks = (await res.json()).map(adaptTask);
    render();
  } catch (e) {
    console.error('fetch failed', e);
  }
}

fetchTasks();
tickClock();
tickCountdowns();
setInterval(fetchTasks, POLL_MS);
setInterval(tickCountdowns, 1000);
setInterval(tickClock, 1000);
setInterval(render, 30_000);
