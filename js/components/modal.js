'use strict';
const Modal = (() => {
  let overlay, modal, titleEl, bodyEl, closeBtn;

  function init() {
    overlay  = document.getElementById('modalOverlay');
    modal    = document.getElementById('modal');
    titleEl  = document.getElementById('modalTitle');
    bodyEl   = document.getElementById('modalBody');
    closeBtn = document.getElementById('modalClose');
    if (!overlay) return;

    closeBtn?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  function open(title, htmlContent) {
    if (!overlay) init();
    if (!overlay) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = htmlContent;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('DOMContentLoaded', init);

  return { open, close };
})();
