/* Small UI helpers for the SPA (vanilla JS components) */

export function createElementFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

export function showModal(contentHtml) {
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  bd.innerHTML = `<div class="modal">${contentHtml}</div>`;
  bd.addEventListener('click', (e)=>{ if(e.target===bd) bd.remove(); });
  document.body.appendChild(bd);
  return bd;
}

export function closeModal(bd) {
  if(bd && bd.remove) bd.remove();
}

export function formatDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}
