'use strict';

const STORAGE_KEY = 'meubolso:v1';

const DEFAULT_CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', type: 'expense' },
  { id: 'moradia', name: 'Moradia', type: 'expense' },
  { id: 'transporte', name: 'Transporte', type: 'expense' },
  { id: 'saude', name: 'Saúde', type: 'expense' },
  { id: 'lazer', name: 'Lazer', type: 'expense' },
  { id: 'educacao', name: 'Educação', type: 'expense' },
  { id: 'contas', name: 'Contas e assinaturas', type: 'expense' },
  { id: 'outros-saida', name: 'Outros', type: 'expense' },
  { id: 'salario', name: 'Salário', type: 'income' },
  { id: 'freela', name: 'Freela / Extra', type: 'income' },
  { id: 'investimentos', name: 'Investimentos', type: 'income' },
  { id: 'outros-entrada', name: 'Outros', type: 'income' },
];

const $ = (sel) => document.querySelector(sel);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = (n) => brl.format(n);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

let state = load();
let current = new Date();
current.setDate(1);

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        transactions: data.transactions || [],
        categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES.slice(),
        budgets: data.budgets || {},
      };
    }
  } catch (e) {
    console.error('Falha ao carregar dados', e);
  }
  return { transactions: [], categories: DEFAULT_CATEGORIES.slice(), budgets: {} };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    alert('Não foi possível salvar os dados neste navegador.');
  }
}

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const todayISO = () => {
  const d = new Date();
  return `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;
};
const catById = (id) => state.categories.find((c) => c.id === id);
const catName = (id) => catById(id)?.name || 'Sem categoria';
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function monthTransactions() {
  const key = monthKey(current);
  return state.transactions.filter((t) => t.date.startsWith(key));
}

// ---------- Render ----------

function render() {
  const label = current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  $('#monthLabel').textContent = label.charAt(0).toUpperCase() + label.slice(1);
  const txs = monthTransactions();
  renderSummary(txs);
  renderChart(txs);
  renderBudgets(txs);
  renderList(txs);
}

function renderSummary(txs) {
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const total = state.transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  $('#sumIncome').textContent = fmt(income);
  $('#sumExpense').textContent = fmt(expense);
  const bal = $('#sumBalance');
  bal.textContent = fmt(income - expense);
  bal.className = income - expense < 0 ? 'neg' : 'pos';
  const tot = $('#sumTotal');
  tot.textContent = fmt(total);
  tot.className = total < 0 ? 'neg' : 'pos';
}

function expenseByCategory(txs) {
  const map = {};
  txs.filter((t) => t.type === 'expense').forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
  return map;
}

function renderChart(txs) {
  const el = $('#chart');
  const entries = Object.entries(expenseByCategory(txs)).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    el.innerHTML = '<p class="empty">Sem gastos neste mês.</p>';
    return;
  }
  const total = entries.reduce((s, [, v]) => s + v, 0);
  el.innerHTML = entries.map(([cat, v]) => {
    const pct = (v / total) * 100;
    return `<div class="row">
      <div class="label"><span>${escapeHtml(catName(cat))}</span><span>${fmt(v)} · ${pct.toFixed(0)}%</span></div>
      <div class="bar"><div style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function renderBudgets(txs) {
  const el = $('#budgets');
  const spent = expenseByCategory(txs);
  const entries = Object.entries(state.budgets).filter(([id]) => catById(id));
  if (!entries.length) {
    el.innerHTML = '<p class="empty">Nenhum orçamento definido. Defina um limite mensal por categoria.</p>';
    return;
  }
  el.innerHTML = entries.map(([id, limit]) => {
    const s = spent[id] || 0;
    const pct = limit > 0 ? (s / limit) * 100 : 0;
    const cls = pct > 100 ? 'over' : pct >= 80 ? 'near' : '';
    return `<div class="budget-item">
      <div class="label">
        <span>${escapeHtml(catName(id))}</span>
        <span>${fmt(s)} / ${fmt(limit)}
          <button class="icon-btn" data-del-budget="${id}" title="Remover orçamento">✕</button></span>
      </div>
      <div class="bar ${cls}"><div style="width:${Math.min(pct, 100)}%"></div></div>
    </div>`;
  }).join('');
}

function renderList(txs) {
  const q = $('#search').value.trim().toLowerCase();
  const type = $('#filterType').value;
  const list = txs
    .filter((t) => !type || t.type === type)
    .filter((t) => !q || t.desc.toLowerCase().includes(q) || catName(t.category).toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);

  $('#emptyMsg').hidden = list.length > 0;
  $('#txList').innerHTML = list.map((t) => {
    const [y, m, d] = t.date.split('-');
    const sign = t.type === 'income' ? '+' : '−';
    return `<li>
      <div class="tx-info">
        <div class="desc">${escapeHtml(t.desc)}</div>
        <div class="meta">${d}/${m}/${y} · ${escapeHtml(catName(t.category))}</div>
      </div>
      <span class="tx-amount ${t.type === 'income' ? 'pos' : 'neg'}">${sign} ${fmt(t.amount)}</span>
      <button class="icon-btn" data-edit="${t.id}" title="Editar">✎</button>
      <button class="icon-btn" data-del="${t.id}" title="Excluir">🗑</button>
    </li>`;
  }).join('');
}

function fillCategorySelects() {
  const type = document.querySelector('input[name="type"]:checked').value;
  const sel = $('#txCategory');
  const prev = sel.value;
  sel.innerHTML = state.categories.filter((c) => c.type === type)
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;

  $('#budgetCategory').innerHTML = state.categories.filter((c) => c.type === 'expense')
    .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
}

function renderCategories() {
  $('#catList').innerHTML = state.categories.map((c) => `<li>
    <span>${escapeHtml(c.name)} <small>${c.type === 'income' ? 'entrada' : 'saída'}</small></span>
    <button class="icon-btn" data-del-cat="${c.id}" title="Excluir">✕</button>
  </li>`).join('');
}

// ---------- Form ----------

function resetForm() {
  $('#txForm').reset();
  $('#txId').value = '';
  $('#txDate').value = todayISO();
  $('#txSubmit').textContent = 'Adicionar';
  $('#txCancel').hidden = true;
  fillCategorySelects();
}

function startEdit(id) {
  const t = state.transactions.find((x) => x.id === id);
  if (!t) return;
  document.querySelector(`input[name="type"][value="${t.type}"]`).checked = true;
  fillCategorySelects();
  $('#txId').value = t.id;
  $('#txDesc').value = t.desc;
  $('#txAmount').value = t.amount;
  $('#txDate').value = t.date;
  $('#txCategory').value = t.category;
  $('#txSubmit').textContent = 'Salvar';
  $('#txCancel').hidden = false;
  $('#txForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#txDesc').focus();
}

$('#txForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = Math.round(parseFloat($('#txAmount').value) * 100) / 100;
  if (!(amount > 0)) return;
  const data = {
    type: document.querySelector('input[name="type"]:checked').value,
    desc: $('#txDesc').value.trim(),
    amount,
    date: $('#txDate').value,
    category: $('#txCategory').value,
  };
  const id = $('#txId').value;
  if (id) {
    Object.assign(state.transactions.find((t) => t.id === id), data);
  } else {
    state.transactions.push({ id: uid(), created: Date.now(), ...data });
  }
  save();
  // pula pro mês da transação, pra ela aparecer na lista
  const [y, m] = data.date.split('-').map(Number);
  current = new Date(y, m - 1, 1);
  resetForm();
  render();
});

$('#txCancel').addEventListener('click', resetForm);
document.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener('change', fillCategorySelects));

$('#txList').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.dataset.edit) startEdit(btn.dataset.edit);
  if (btn.dataset.del && confirm('Excluir esta transação?')) {
    state.transactions = state.transactions.filter((t) => t.id !== btn.dataset.del);
    if ($('#txId').value === btn.dataset.del) resetForm();
    save();
    render();
  }
});

// ---------- Navegação e filtros ----------

$('#prevMonth').addEventListener('click', () => { current.setMonth(current.getMonth() - 1); render(); });
$('#nextMonth').addEventListener('click', () => { current.setMonth(current.getMonth() + 1); render(); });
$('#search').addEventListener('input', () => renderList(monthTransactions()));
$('#filterType').addEventListener('change', () => renderList(monthTransactions()));

// ---------- Orçamentos ----------

$('#budgetForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = parseFloat($('#budgetAmount').value);
  const cat = $('#budgetCategory').value;
  if (!cat || !(v >= 0)) return;
  if (v === 0) delete state.budgets[cat];
  else state.budgets[cat] = Math.round(v * 100) / 100;
  save();
  $('#budgetAmount').value = '';
  render();
});

$('#budgets').addEventListener('click', (e) => {
  const id = e.target.closest('button')?.dataset.delBudget;
  if (!id) return;
  delete state.budgets[id];
  save();
  render();
});

// ---------- Categorias ----------

$('#manageCats').addEventListener('click', () => { renderCategories(); $('#catDialog').showModal(); });
$('#catClose').addEventListener('click', () => $('#catDialog').close());

$('#catForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#catName').value.trim();
  const type = $('#catType').value;
  if (!name) return;
  if (state.categories.some((c) => c.type === type && c.name.toLowerCase() === name.toLowerCase())) {
    alert('Essa categoria já existe.');
    return;
  }
  state.categories.push({ id: uid(), name, type });
  save();
  $('#catName').value = '';
  renderCategories();
  fillCategorySelects();
});

$('#catList').addEventListener('click', (e) => {
  const id = e.target.closest('button')?.dataset.delCat;
  if (!id) return;
  const used = state.transactions.filter((t) => t.category === id).length;
  const msg = used
    ? `Essa categoria tem ${used} transação(ões). Elas vão ficar como "Sem categoria". Excluir mesmo assim?`
    : 'Excluir esta categoria?';
  if (!confirm(msg)) return;
  state.categories = state.categories.filter((c) => c.id !== id);
  delete state.budgets[id];
  save();
  renderCategories();
  fillCategorySelects();
  render();
});

// ---------- Exportar / importar ----------

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

$('#exportCsv').addEventListener('click', () => {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor']];
  [...state.transactions].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => {
    rows.push([t.date, t.type === 'income' ? 'Entrada' : 'Saída', t.desc, catName(t.category),
      (t.type === 'income' ? t.amount : -t.amount).toFixed(2).replace('.', ',')]);
  });
  // ; e BOM pro Excel em português abrir certinho
  download('meubolso.csv', '﻿' + rows.map((r) => r.map(q).join(';')).join('\n'), 'text/csv;charset=utf-8');
});

$('#exportJson').addEventListener('click', () => {
  download(`meubolso-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json');
});

$('#importJson').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.transactions)) throw new Error('formato inválido');
    if (!confirm('Isso vai substituir todos os dados atuais. Continuar?')) return;
    state = {
      transactions: data.transactions,
      categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES.slice(),
      budgets: data.budgets || {},
    };
    save();
    resetForm();
    render();
  } catch {
    alert('Arquivo de backup inválido.');
  }
});

// ---------- Init ----------

resetForm();
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
