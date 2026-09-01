const errorEl = document.getElementById('error');
const loginScreenEl = document.getElementById('loginScreen');
const dashboardEl = document.getElementById('dashboard');

let currentPassword = '';
let inscriptions = [];

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function render() {
  document.getElementById('count').textContent = inscriptions.length;
  document.getElementById('totalPersonnes').textContent = inscriptions.reduce(
    (sum, i) => sum + (parseInt(i.nb, 10) || 1),
    0
  );

  const body = document.getElementById('listBody');
  body.innerHTML = inscriptions.length
    ? inscriptions
        .map(
          (i) => `<tr>
            <td>${formatDate(i.date)}</td>
            <td>${esc(i.prenom)}</td>
            <td>${esc(i.nom)}</td>
            <td>${esc(i.tel)}</td>
            <td><a href="mailto:${esc(i.email)}">${esc(i.email)}</a></td>
            <td>${esc(i.creneau)}</td>
            <td>${esc(i.niveau)}</td>
            <td>${esc(i.nb || '1')}</td>
            <td>${esc(i.message)}</td>
            <td><button class="delete-order-btn" data-id="${esc(i.id)}">Suppr.</button></td>
          </tr>`
        )
        .join('')
    : '<tr><td colspan="10" class="empty">Aucune inscription pour l\'instant</td></tr>';

  body.querySelectorAll('.delete-order-btn').forEach((btn) => {
    btn.addEventListener('click', () => remove(btn));
  });
}

async function remove(btn) {
  const id = btn.dataset.id;
  const row = btn.closest('tr');
  const name = `${row.children[1].textContent} ${row.children[2].textContent}`.trim();
  if (!confirm(`Supprimer définitivement l'inscription de ${name} ?`)) return;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const res = await fetch('/api/jpo-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + currentPassword },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Erreur');
    inscriptions = inscriptions.filter((i) => i.id !== id);
    render();
  } catch (e) {
    alert('Erreur : ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Suppr.';
  }
}

function exportCsv() {
  const headers = ['Date', 'Prénom', 'Nom', 'Téléphone', 'Email', 'Créneau', 'Niveau', 'Nb personnes', 'Message'];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(cell).join(';')];
  for (const i of inscriptions) {
    lines.push(
      [
        formatDate(i.date),
        i.prenom,
        i.nom,
        i.tel,
        i.email,
        i.creneau,
        i.niveau,
        i.nb || '1',
        i.message,
      ]
        .map(cell)
        .join(';')
    );
  }
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inscriptions-jpo-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function load(skipButtonState) {
  const loadBtn = document.getElementById('loadBtn');
  const password = skipButtonState ? currentPassword : document.getElementById('password').value;
  errorEl.textContent = '';
  if (!skipButtonState) {
    loadBtn.disabled = true;
    loadBtn.textContent = 'Connexion…';
  }

  try {
    const res = await fetch('/api/jpo-list', {
      headers: { Authorization: 'Bearer ' + password },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || `Erreur (HTTP ${res.status})`);

    currentPassword = password;
    inscriptions = data.inscriptions || [];
    render();

    loginScreenEl.hidden = true;
    dashboardEl.hidden = false;
  } catch (e) {
    errorEl.textContent = 'Erreur : ' + e.message;
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'Entrer';
  }
}

document.getElementById('loadBtn').addEventListener('click', () => load(false));
document.getElementById('password').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') load(false);
});
document.getElementById('exportBtn').addEventListener('click', exportCsv);
