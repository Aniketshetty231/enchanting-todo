const STORAGE_KEY = "enchanting_todos_v1";

/** @typedef {{ id:string, title:string, completed:boolean, due?:string, priority:'high'|'normal'|'low', tags:string[], order:number, selected?:boolean }} Todo */

/** @type {Todo[]} */
let todos = [];

const els = {
  list: document.getElementById("list"),
  template: document.getElementById("item-template"),
  form: document.getElementById("create-form"),
  title: document.getElementById("input-title"),
  tags: document.getElementById("input-tags"),
  date: document.getElementById("input-date"),
  priority: document.getElementById("input-priority"),
  search: document.getElementById("input-search"),
  filterStatus: document.getElementById("filter-status"),
  filterPriority: document.getElementById("filter-priority"),
  bulkComplete: document.getElementById("btn-bulk-complete"),
  clearCompleted: document.getElementById("btn-clear-completed"),
  counter: document.getElementById("counter"),
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function seedIfEmpty() {
  if (todos.length) return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  todos = [
    { id: uid(), title: "Welcome to Enchanting To‑Do ✨", completed: false, due: today, priority: 'normal', tags: ["welcome"], order: 0 },
    { id: uid(), title: "Edit tasks inline by typing", completed: false, priority: 'low', tags: ["tips"], order: 1 },
    { id: uid(), title: "Drag to reorder items", completed: false, priority: 'high', tags: ["pro"], order: 2 },
  ];
}

function getFilters() {
  const q = (els.search.value || "").toLowerCase();
  const status = els.filterStatus.value;
  const pr = els.filterPriority.value;
  return { q, status, pr };
}

function applyFilters(list) {
  const { q, status, pr } = getFilters();
  return list.filter(item => {
    if (status === 'active' && item.completed) return false;
    if (status === 'completed' && !item.completed) return false;
    if (pr !== 'all' && item.priority !== pr) return false;
    if (q) {
      const hay = `${item.title} ${item.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function formatDue(due) {
  if (!due) return '';
  const diff = Math.ceil((new Date(due) - new Date()) / (1000*60*60*24));
  if (isNaN(diff)) return `Due ${due}`;
  if (diff < 0) return `Overdue ${Math.abs(diff)}d`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff}d`;
}

function render() {
  // sort by order then by created fallback
  const sorted = [...todos].sort((a,b) => a.order - b.order);
  const visible = applyFilters(sorted);
  els.list.innerHTML = '';

  visible.forEach(item => {
    const node = /** @type {HTMLElement} */ (els.template.content.firstElementChild.cloneNode(true));
    node.dataset.id = item.id;
    if (item.completed) node.classList.add('todo--completed');

    const toggle = node.querySelector('.todo__toggle');
    const title = node.querySelector('.todo__title');
    const del = node.querySelector('.todo__delete');
    const tags = node.querySelector('.todo__tags');
    const due = node.querySelector('.todo__due');
    const badge = node.querySelector('[data-priority]');
    const select = node.querySelector('.todo__select');

    toggle.checked = item.completed;
    title.value = item.title;
    tags.textContent = item.tags.length ? `#${item.tags.join('  #')}` : '';
    due.textContent = formatDue(item.due);
    badge.textContent = item.priority.toUpperCase();
    badge.classList.add('badge', `badge--${item.priority}`);
    select.checked = !!item.selected;

    // interactions
    toggle.addEventListener('change', () => {
      update(item.id, { completed: toggle.checked });
    });

    title.addEventListener('change', () => {
      const v = title.value.trim();
      if (!v) return title.value = item.title;
      update(item.id, { title: v });
    });

    del.addEventListener('click', () => {
      remove(item.id);
    });

    select.addEventListener('change', () => {
      update(item.id, { selected: select.checked });
    });

    // drag and drop
    node.addEventListener('dragstart', (e) => onDragStart(e, item.id));
    node.addEventListener('dragover', (e) => onDragOver(e, item.id));
    node.addEventListener('drop', (e) => onDrop(e, item.id));
    node.addEventListener('dragend', onDragEnd);

    els.list.appendChild(node);
  });

  const active = todos.filter(t => !t.completed).length;
  els.counter.textContent = `${active} item${active===1?'':'s'} left • ${todos.length} total`;
  save();
}

function create({ title, tags, due, priority }) {
  const maxOrder = todos.length ? Math.max(...todos.map(t => t.order)) : -1;
  const item = { id: uid(), title, completed: false, due: due || undefined, priority, tags, order: maxOrder + 1 };
  todos.push(item);
  render();
}

function update(id, patch) {
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return;
  todos[idx] = { ...todos[idx], ...patch };
  render();
}

function remove(id) {
  todos = todos.filter(t => t.id !== id);
  render();
}

// bulk
function bulkCompleteSelected() {
  let changed = false;
  todos = todos.map(t => {
    if (t.selected && !t.completed) { changed = true; return { ...t, completed: true, selected: false }; }
    return { ...t, selected: false };
  });
  if (changed) render(); else render();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  // normalize order
  todos = todos.map((t, i) => ({ ...t, order: i }));
  render();
}

// dnd helpers
let dragState = { id: null };
function onDragStart(e, id) {
  dragState.id = id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', id);
  e.currentTarget.setAttribute('aria-grabbed', 'true');
}
function onDragOver(e, overId) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}
function onDrop(e, overId) {
  e.preventDefault();
  const fromId = dragState.id || e.dataTransfer.getData('text/plain');
  if (!fromId || fromId === overId) return;
  const fromIdx = todos.findIndex(t => t.id === fromId);
  const toIdx = todos.findIndex(t => t.id === overId);
  if (fromIdx === -1 || toIdx === -1) return;
  const moved = todos.splice(fromIdx, 1)[0];
  todos.splice(toIdx, 0, moved);
  // reassign order
  todos = todos.map((t, i) => ({ ...t, order: i }));
  render();
}
function onDragEnd(e) {
  e.currentTarget.removeAttribute('aria-grabbed');
}

// events
els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = els.title.value.trim();
  if (!title) return;
  const tags = (els.tags.value || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  create({ title, tags, due: els.date.value || undefined, priority: /** @type any */ (els.priority.value) });
  els.title.value = '';
  els.tags.value = '';
  els.date.value = '';
  els.priority.value = 'normal';
  els.title.focus();
});

[els.search, els.filterStatus, els.filterPriority].forEach(el => {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

els.bulkComplete.addEventListener('click', bulkCompleteSelected);
els.clearCompleted.addEventListener('click', clearCompleted);

// init
todos = load();
seedIfEmpty();
render();


