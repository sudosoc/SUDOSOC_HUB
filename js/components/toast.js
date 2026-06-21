'use strict';
const Toast = (() => {
  let container;

  function getContainer() {
    if (!container) container = document.getElementById('toastContainer');
    return container;
  }

  function show(message, type = 'info', duration = 3500) {
    const c = getContainer();
    if (!c) return;

    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="toast-dot ${type}" aria-hidden="true"></span>
      <span class="toast-msg">${_esc(message)}</span>
      <button class="toast-close" aria-label="Dismiss notification">&times;</button>
    `;

    const dismiss = () => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };

    el.querySelector('.toast-close').addEventListener('click', dismiss);
    c.appendChild(el);

    if (duration > 0) setTimeout(dismiss, duration);
    return el;
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    success: (msg, d) => show(msg, 'success', d),
    error:   (msg, d) => show(msg, 'error', d),
    warning: (msg, d) => show(msg, 'warning', d),
    info:    (msg, d) => show(msg, 'info', d),
  };
})();
